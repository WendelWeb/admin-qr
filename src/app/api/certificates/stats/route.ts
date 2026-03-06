import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates, settings } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

// Billing cycle: 4th of each month to 3rd of next month
function getBillingPeriod(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (day >= 4) {
    // Current period: 4th of this month → 3rd of next month
    return {
      start: new Date(year, month, 4),
      end: new Date(year, month + 1, 3, 23, 59, 59, 999),
    };
  } else {
    // Before the 4th: period is 4th of previous month → 3rd of this month
    return {
      start: new Date(year, month - 1, 4),
      end: new Date(year, month, 3, 23, 59, 59, 999),
    };
  }
}

function getNextBillingDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (day >= 4) {
    return new Date(year, month + 1, 4);
  } else {
    return new Date(year, month, 4);
  }
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatPeriodLabel(start: Date, end: Date) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const s = `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  const e = `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  return `${s} — ${e}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config] = await db.select().from(settings).limit(1);
  const qrPrice = parseFloat(config?.qrPrice ?? "0.40");

  const now = new Date();
  const currentPeriod = getBillingPeriod(now);
  const nextBilling = getNextBillingDate(now);

  // Days until next billing
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilBilling = Math.ceil((nextBilling.getTime() - now.getTime()) / msPerDay);

  // Current billing period count
  const [currentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates)
    .where(
      and(
        gte(certificates.createdAt, currentPeriod.start),
        lte(certificates.createdAt, currentPeriod.end)
      )
    );

  // Daily breakdown for current period
  const dailyBreakdown = await db
    .select({
      date: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(
      and(
        gte(certificates.createdAt, currentPeriod.start),
        lte(certificates.createdAt, currentPeriod.end)
      )
    )
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM-DD')`);

  // Last 6 months monthly breakdown
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthlyBreakdown = await db
    .select({
      month: sql<string>`to_char(${certificates.createdAt}, 'YYYY-MM')`,
      count: sql<number>`count(*)::int`,
    })
    .from(certificates)
    .where(gte(certificates.createdAt, sixMonthsAgo))
    .groupBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${certificates.createdAt}, 'YYYY-MM')`);

  // Previous billing periods (only those with certificates)
  const previousPeriods = [];
  let tempDate = new Date(currentPeriod.start);

  for (let i = 0; i < 12; i++) {
    // Go to previous period (subtract 1 day from start to land in previous period)
    tempDate = new Date(tempDate.getTime() - msPerDay);
    const period = getBillingPeriod(tempDate);

    const [count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(certificates)
      .where(
        and(
          gte(certificates.createdAt, period.start),
          lte(certificates.createdAt, period.end)
        )
      );

    // Only include periods that have certificates
    if (count.count > 0) {
      previousPeriods.push({
        start: formatDate(period.start),
        end: formatDate(period.end),
        label: formatPeriodLabel(period.start, period.end),
        count: count.count,
        cost: (count.count * qrPrice).toFixed(2),
      });
    }

    tempDate = new Date(period.start);

    // Stop after finding 5 periods with data
    if (previousPeriods.length >= 5) break;
  }

  // Total all-time
  const [totalCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates);

  return NextResponse.json({
    qrPrice,
    currentPeriod: {
      start: formatDate(currentPeriod.start),
      end: formatDate(currentPeriod.end),
      label: formatPeriodLabel(currentPeriod.start, currentPeriod.end),
      count: currentCount.count,
      cost: (currentCount.count * qrPrice).toFixed(2),
    },
    nextBillingDate: formatDate(nextBilling),
    daysUntilBilling,
    daily: dailyBreakdown,
    monthly: monthlyBreakdown,
    previousPeriods,
    totalCertificates: totalCount.count,
    totalCost: (totalCount.count * qrPrice).toFixed(2),
  });
}
