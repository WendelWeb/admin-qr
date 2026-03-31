import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates, settings } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

// Internal billing day (actual trigger) vs display day (shown in UI)
const BILLING_DAY = 2;
const PERIOD_END_DAY = 1;
const DISPLAY_BILLING_DAY = 4;
const DISPLAY_PERIOD_END_DAY = 3;

// Billing cycle: internally 2nd to 1st, displayed as 4th to 3rd
function getBillingPeriod(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (day >= BILLING_DAY) {
    return {
      start: new Date(year, month, BILLING_DAY),
      end: new Date(year, month + 1, PERIOD_END_DAY, 23, 59, 59, 999),
      displayStart: new Date(year, month, DISPLAY_BILLING_DAY),
      displayEnd: new Date(year, month + 1, DISPLAY_PERIOD_END_DAY, 23, 59, 59, 999),
    };
  } else {
    return {
      start: new Date(year, month - 1, BILLING_DAY),
      end: new Date(year, month, PERIOD_END_DAY, 23, 59, 59, 999),
      displayStart: new Date(year, month - 1, DISPLAY_BILLING_DAY),
      displayEnd: new Date(year, month, DISPLAY_PERIOD_END_DAY, 23, 59, 59, 999),
    };
  }
}

function getNextBillingDateDisplay(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (day >= BILLING_DAY) {
    return new Date(year, month + 1, DISPLAY_BILLING_DAY);
  } else {
    return new Date(year, month, DISPLAY_BILLING_DAY);
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
  const nextBillingDisplay = getNextBillingDateDisplay(now);

  // Days until next billing (use display date so UI countdown matches displayed date)
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilBilling = Math.ceil((nextBillingDisplay.getTime() - now.getTime()) / msPerDay);

  // Current billing period count (use internal dates for actual data)
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
        start: formatDate(period.displayStart),
        end: formatDate(period.displayEnd),
        label: formatPeriodLabel(period.displayStart, period.displayEnd),
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
      start: formatDate(currentPeriod.displayStart),
      end: formatDate(currentPeriod.displayEnd),
      label: formatPeriodLabel(currentPeriod.displayStart, currentPeriod.displayEnd),
      count: currentCount.count,
      cost: (currentCount.count * qrPrice).toFixed(2),
    },
    nextBillingDate: formatDate(nextBillingDisplay),
    daysUntilBilling,
    daily: dailyBreakdown,
    monthly: monthlyBreakdown,
    previousPeriods,
    totalCertificates: totalCount.count,
    totalCost: (totalCount.count * qrPrice).toFixed(2),
  });
}
