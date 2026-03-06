import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates, settings } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const from = params.get("from"); // YYYY-MM-DD
  const to = params.get("to"); // YYYY-MM-DD

  const [config] = await db.select().from(settings).limit(1);
  const qrPrice = parseFloat(config?.qrPrice ?? "0.40");

  // Build date filter conditions
  const conditions = [];
  if (from) conditions.push(gte(certificates.createdAt, new Date(from + "T00:00:00")));
  if (to) conditions.push(lte(certificates.createdAt, new Date(to + "T23:59:59.999")));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Total certificates in range
  const [totalInRange] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(whereClause);

  // Total all time
  const [totalAllTime] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates);

  // Daily breakdown
  const daily = await db
    .select({
      date: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`);

  // Weekly breakdown
  const weekly = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${certificates.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`date_trunc('week', ${certificates.createdAt})`)
    .orderBy(sql`date_trunc('week', ${certificates.createdAt})`);

  // Monthly breakdown
  const monthly = await db
    .select({
      month: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM')`);

  // Top physicians
  const topPhysicians = await db
    .select({
      name: certificates.examiningPhysician,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(certificates.examiningPhysician)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  // Top countries
  const topCountries = await db
    .select({
      name: certificates.country,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(certificates.country)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  // Expired vs Active
  const today = new Date().toISOString().split("T")[0];
  const [activeCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(whereClause ? and(whereClause, gte(certificates.expiryDate, today)) : gte(certificates.expiryDate, today));

  const [expiredCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(whereClause ? and(whereClause, lte(certificates.expiryDate, today)) : lte(certificates.expiryDate, today));

  // Peak hours (hour of day distribution)
  const peakHours = await db
    .select({
      hour: sql<number>`extract(hour from ${certificates.createdAt})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`extract(hour from ${certificates.createdAt})`)
    .orderBy(sql`extract(hour from ${certificates.createdAt})`);

  // Day of week distribution
  const dayOfWeek = await db
    .select({
      day: sql<number>`extract(dow from ${certificates.createdAt})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`extract(dow from ${certificates.createdAt})`)
    .orderBy(sql`extract(dow from ${certificates.createdAt})`);

  // Activity by admin
  const byAdmin = await db
    .select({
      admin: sql<string>`COALESCE(${certificates.createdBy}, 'Unknown')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`COALESCE(${certificates.createdBy}, 'Unknown')`)
    .orderBy(sql`count(*) DESC`);

  // Validity distribution (1yr, 2yr, 3yr based on dateIssued vs expiryDate)
  const validityDist = await db
    .select({
      years: sql<number>`extract(year from age(${certificates.expiryDate}::timestamp, ${certificates.dateIssued}::timestamp))::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(whereClause)
    .groupBy(sql`extract(year from age(${certificates.expiryDate}::timestamp, ${certificates.dateIssued}::timestamp))`)
    .orderBy(sql`extract(year from age(${certificates.expiryDate}::timestamp, ${certificates.dateIssued}::timestamp))`);

  // Recent certificates (last 10 in range)
  const recent = await db
    .select({
      id: certificates.id,
      name: certificates.name,
      certificateNumber: certificates.certificateNumber,
      country: certificates.country,
      examiningPhysician: certificates.examiningPhysician,
      createdBy: certificates.createdBy,
      createdAt: certificates.createdAt,
      expiryDate: certificates.expiryDate,
    })
    .from(certificates)
    .where(whereClause)
    .orderBy(sql`${certificates.createdAt} DESC`)
    .limit(10);

  const totalCost = totalInRange.count * qrPrice;
  const creditCost = totalInRange.count; // 1 credit per certificate

  return NextResponse.json({
    qrPrice,
    totalInRange: totalInRange.count,
    totalAllTime: totalAllTime.count,
    totalCost: totalCost.toFixed(2),
    creditCost,
    daily,
    weekly,
    monthly,
    topPhysicians,
    topCountries,
    activeCount: activeCount.count,
    expiredCount: expiredCount.count,
    peakHours,
    dayOfWeek,
    byAdmin,
    validityDist,
    recent,
  });
}
