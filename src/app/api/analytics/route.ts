import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates, settings } from "@/db/schema";
import { sql, gte, lte, and, desc } from "drizzle-orm";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date: Date) {
  const q = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), q, 1);
}

function startOfSemester(date: Date) {
  const s = date.getMonth() < 6 ? 0 : 6;
  return new Date(date.getFullYear(), s, 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function countInRange(from: Date, to: Date) {
  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(and(
      sql`${certificates.createdAt}::date >= ${fromStr}::date`,
      sql`${certificates.createdAt}::date <= ${toStr}::date`
    ));
  return result.count;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");

  const [config] = await db.select().from(settings).limit(1);
  const qrPrice = parseFloat(config?.qrPrice ?? "0.40");

  // Build date filter using SQL date cast to avoid timezone issues
  const conditions = [];
  if (from) conditions.push(sql`${certificates.createdAt}::date >= ${from}::date`);
  if (to) conditions.push(sql`${certificates.createdAt}::date <= ${to}::date`);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // --- BASIC COUNTS ---
  const [totalInRange] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(whereClause);

  const [totalAllTime] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates);

  // --- BREAKDOWNS ---
  const daily = await db
    .select({
      date: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`);

  const weekly = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${certificates.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`date_trunc('week', ${certificates.createdAt})`)
    .orderBy(sql`date_trunc('week', ${certificates.createdAt})`);

  const monthly = await db
    .select({
      month: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM')`);

  // --- TOP LISTS ---
  const topPhysicians = await db
    .select({ name: certificates.examiningPhysician, count: sql<number>`count(*)::int` })
    .from(certificates).where(whereClause)
    .groupBy(certificates.examiningPhysician)
    .orderBy(sql`count(*) DESC`).limit(10);

  const topCountries = await db
    .select({ name: certificates.country, count: sql<number>`count(*)::int` })
    .from(certificates).where(whereClause)
    .groupBy(certificates.country)
    .orderBy(sql`count(*) DESC`).limit(10);

  // --- STATUS ---
  const today = new Date().toISOString().split("T")[0];
  const [activeCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(whereClause ? and(whereClause, gte(certificates.expiryDate, today)) : gte(certificates.expiryDate, today));

  const [expiredCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(whereClause ? and(whereClause, lte(certificates.expiryDate, today)) : lte(certificates.expiryDate, today));

  // --- PEAK HOURS ---
  const peakHours = await db
    .select({ hour: sql<number>`extract(hour from ${certificates.createdAt})::int`, count: sql<number>`count(*)::int` })
    .from(certificates).where(whereClause)
    .groupBy(sql`extract(hour from ${certificates.createdAt})`)
    .orderBy(sql`extract(hour from ${certificates.createdAt})`);

  // --- DAY OF WEEK ---
  const dayOfWeek = await db
    .select({ day: sql<number>`extract(dow from ${certificates.createdAt})::int`, count: sql<number>`count(*)::int` })
    .from(certificates).where(whereClause)
    .groupBy(sql`extract(dow from ${certificates.createdAt})`)
    .orderBy(sql`extract(dow from ${certificates.createdAt})`);

  // --- ACTIVITY BY ADMIN ---
  const byAdmin = await db
    .select({ admin: sql<string>`COALESCE(${certificates.createdBy}, 'Unknown')`, count: sql<number>`count(*)::int` })
    .from(certificates).where(whereClause)
    .groupBy(sql`COALESCE(${certificates.createdBy}, 'Unknown')`)
    .orderBy(sql`count(*) DESC`);

  // --- VALIDITY ---
  const validityDist = await db
    .select({
      years: sql<number>`extract(year from age(${certificates.expiryDate}::timestamp, ${certificates.dateIssued}::timestamp))::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates).where(whereClause)
    .groupBy(sql`extract(year from age(${certificates.expiryDate}::timestamp, ${certificates.dateIssued}::timestamp))`)
    .orderBy(sql`extract(year from age(${certificates.expiryDate}::timestamp, ${certificates.dateIssued}::timestamp))`);

  // --- RECENT ---
  const recent = await db
    .select({
      id: certificates.id, name: certificates.name,
      certificateNumber: certificates.certificateNumber,
      country: certificates.country,
      examiningPhysician: certificates.examiningPhysician,
      createdBy: certificates.createdBy,
      createdAt: certificates.createdAt,
      expiryDate: certificates.expiryDate,
    })
    .from(certificates).where(whereClause)
    .orderBy(desc(certificates.createdAt)).limit(10);

  // --- COMPARISONS ---
  const now = new Date();

  // Today vs yesterday
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = daysAgo(1);
  const todayCount = await countInRange(todayStart, endOfDay(now));
  const yesterdayCount = await countInRange(yesterdayStart, endOfDay(yesterdayStart));

  // This week vs last week
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart); lastWeekEnd.setMilliseconds(-1);
  const thisWeekCount = await countInRange(thisWeekStart, endOfDay(now));
  const lastWeekCount = await countInRange(lastWeekStart, lastWeekEnd);

  // This month vs last month
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = new Date(thisMonthStart); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(thisMonthStart); lastMonthEnd.setMilliseconds(-1);
  const thisMonthCount = await countInRange(thisMonthStart, endOfDay(now));
  const lastMonthCount = await countInRange(lastMonthStart, lastMonthEnd);

  // This quarter vs last quarter
  const thisQuarterStart = startOfQuarter(now);
  const lastQuarterStart = new Date(thisQuarterStart); lastQuarterStart.setMonth(lastQuarterStart.getMonth() - 3);
  const lastQuarterEnd = new Date(thisQuarterStart); lastQuarterEnd.setMilliseconds(-1);
  const thisQuarterCount = await countInRange(thisQuarterStart, endOfDay(now));
  const lastQuarterCount = await countInRange(lastQuarterStart, lastQuarterEnd);

  // This semester vs last semester
  const thisSemesterStart = startOfSemester(now);
  const lastSemesterStart = new Date(thisSemesterStart); lastSemesterStart.setMonth(lastSemesterStart.getMonth() - 6);
  const lastSemesterEnd = new Date(thisSemesterStart); lastSemesterEnd.setMilliseconds(-1);
  const thisSemesterCount = await countInRange(thisSemesterStart, endOfDay(now));
  const lastSemesterCount = await countInRange(lastSemesterStart, lastSemesterEnd);

  // This year vs last year
  const thisYearStart = startOfYear(now);
  const lastYearStart = new Date(thisYearStart); lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
  const lastYearEnd = new Date(thisYearStart); lastYearEnd.setMilliseconds(-1);
  const thisYearCount = await countInRange(thisYearStart, endOfDay(now));
  const lastYearCount = await countInRange(lastYearStart, lastYearEnd);

  function calcChange(current: number, previous: number) {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  }

  const comparisons = {
    today: { current: todayCount, previous: yesterdayCount, change: calcChange(todayCount, yesterdayCount), label: "Today vs Yesterday" },
    week: { current: thisWeekCount, previous: lastWeekCount, change: calcChange(thisWeekCount, lastWeekCount), label: "This Week vs Last" },
    month: { current: thisMonthCount, previous: lastMonthCount, change: calcChange(thisMonthCount, lastMonthCount), label: "This Month vs Last" },
    quarter: { current: thisQuarterCount, previous: lastQuarterCount, change: calcChange(thisQuarterCount, lastQuarterCount), label: "This Quarter vs Last" },
    semester: { current: thisSemesterCount, previous: lastSemesterCount, change: calcChange(thisSemesterCount, lastSemesterCount), label: "This Semester vs Last" },
    year: { current: thisYearCount, previous: lastYearCount, change: calcChange(thisYearCount, lastYearCount), label: "This Year vs Last" },
  };

  // --- HEATMAP (last 365 days) ---
  const oneYearAgo = daysAgo(365);
  const heatmap = await db
    .select({
      date: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(gte(certificates.createdAt, oneYearAgo))
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`);

  // --- MONTHLY CALENDAR (current month) ---
  const calendarMonthStart = startOfMonth(now);
  const calendarMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const calendarDaily = await db
    .select({
      date: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(and(gte(certificates.createdAt, calendarMonthStart), lte(certificates.createdAt, calendarMonthEnd)))
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`);

  // --- LAST 24H ---
  const twentyFourAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last24h = await db
    .select({
      hour: sql<string>`to_char(${certificates.createdAt}, 'HH24:00')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(gte(certificates.createdAt, twentyFourAgo))
    .groupBy(sql`to_char(${certificates.createdAt}, 'HH24:00')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'HH24:00')`);

  // --- RECORDS ---
  // Busiest day
  const [busiestDay] = await db
    .select({
      date: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  // Busiest week
  const [busiestWeek] = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${certificates.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .groupBy(sql`date_trunc('week', ${certificates.createdAt})`)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  // Busiest month
  const [busiestMonth] = await db
    .select({
      month: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  // Most active admin
  const [mostActiveAdmin] = await db
    .select({
      admin: sql<string>`COALESCE(${certificates.createdBy}, 'Unknown')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .groupBy(sql`COALESCE(${certificates.createdBy}, 'Unknown')`)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  // Most frequent country
  const [topCountry] = await db
    .select({ name: certificates.country, count: sql<number>`count(*)::int` })
    .from(certificates)
    .groupBy(certificates.country)
    .orderBy(sql`count(*) DESC`).limit(1);

  // Most solicited physician
  const [topPhysician] = await db
    .select({ name: certificates.examiningPhysician, count: sql<number>`count(*)::int` })
    .from(certificates)
    .groupBy(certificates.examiningPhysician)
    .orderBy(sql`count(*) DESC`).limit(1);

  // Longest streak (consecutive days with certificates)
  const allDays = await db
    .select({ date: sql<string>`DISTINCT to_char(${certificates.createdAt}, 'YYYY-MM-DD')` })
    .from(certificates)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`);

  let longestStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < allDays.length; i++) {
    const prev = new Date(allDays[i - 1].date + "T00:00:00");
    const curr = new Date(allDays[i].date + "T00:00:00");
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);
  if (allDays.length === 0) longestStreak = 0;

  const records = {
    busiestDay: busiestDay ? { date: busiestDay.date, count: busiestDay.count } : null,
    busiestWeek: busiestWeek ? { week: busiestWeek.week, count: busiestWeek.count } : null,
    busiestMonth: busiestMonth ? { month: busiestMonth.month, count: busiestMonth.count } : null,
    mostActiveAdmin: mostActiveAdmin ? { admin: mostActiveAdmin.admin, count: mostActiveAdmin.count } : null,
    topCountry: topCountry ? { name: topCountry.name, count: topCountry.count } : null,
    topPhysician: topPhysician ? { name: topPhysician.name, count: topPhysician.count } : null,
    longestStreak,
  };

  // --- PROJECTION ---
  const daysIntoMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const avgPerDay = daysIntoMonth > 0 ? thisMonthCount / daysIntoMonth : 0;
  const projectedMonthTotal = Math.round(avgPerDay * daysInMonth);
  const projectedMonthCost = (projectedMonthTotal * qrPrice).toFixed(2);
  const trend = thisMonthCount > lastMonthCount ? "up" : thisMonthCount < lastMonthCount ? "down" : "stable";

  const projection = {
    avgPerDay: Math.round(avgPerDay * 10) / 10,
    projectedMonthTotal,
    projectedMonthCost,
    daysRemaining: daysInMonth - daysIntoMonth,
    trend,
  };

  // --- SPARKLINE DATA (last 14 days for KPI cards) ---
  const sparklineDays = 14;
  const sparklineFrom = daysAgo(sparklineDays);
  const sparkline = await db
    .select({
      date: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(gte(certificates.createdAt, sparklineFrom))
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`);

  // Fill all 14 days
  const sparklineData: number[] = [];
  for (let i = sparklineDays; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().split("T")[0];
    const found = sparkline.find((s) => s.date === key);
    sparklineData.push(found ? found.count : 0);
  }

  return NextResponse.json({
    qrPrice,
    totalInRange: totalInRange.count,
    totalAllTime: totalAllTime.count,
    totalCost: (totalInRange.count * qrPrice).toFixed(2),
    creditCost: totalInRange.count,
    daily, weekly, monthly,
    topPhysicians, topCountries,
    activeCount: activeCount.count,
    expiredCount: expiredCount.count,
    peakHours, dayOfWeek,
    byAdmin, validityDist, recent,
    comparisons,
    heatmap,
    calendarDaily,
    calendarMonth: now.getMonth(),
    calendarYear: now.getFullYear(),
    last24h,
    records,
    projection,
    sparklineData,
  });
}
