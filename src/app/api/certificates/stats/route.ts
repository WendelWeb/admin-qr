import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates, settings } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

function getBillingPeriod(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (day <= 15) {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month, 15, 23, 59, 59, 999),
      label: `1 - 15`,
    };
  } else {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      start: new Date(year, month, 16),
      end: new Date(year, month, lastDay, 23, 59, 59, 999),
      label: `16 - ${lastDay}`,
    };
  }
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config] = await db.select().from(settings).limit(1);
  const qrPrice = parseFloat(config?.qrPrice ?? "1.50");

  const now = new Date();
  const currentPeriod = getBillingPeriod(now);

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

  // Previous 5 billing periods
  const previousPeriods = [];
  let tempDate = new Date(now);

  for (let i = 0; i < 5; i++) {
    // Go to previous period
    if (tempDate.getDate() <= 15) {
      // Go to 16-end of previous month
      tempDate = new Date(tempDate.getFullYear(), tempDate.getMonth() - 1, 16);
    } else {
      // Go to 1-15 of same month
      tempDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
    }

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

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    previousPeriods.push({
      start: formatDate(period.start),
      end: formatDate(period.end),
      label: `${months[period.start.getMonth()]} ${period.label}, ${period.start.getFullYear()}`,
      count: count.count,
      cost: (count.count * qrPrice).toFixed(2),
    });
  }

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Total all-time
  const [totalCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(certificates);

  return NextResponse.json({
    qrPrice,
    currentPeriod: {
      start: formatDate(currentPeriod.start),
      end: formatDate(currentPeriod.end),
      label: `${months[currentPeriod.start.getMonth()]} ${currentPeriod.label}, ${currentPeriod.start.getFullYear()}`,
      count: currentCount.count,
      cost: (currentCount.count * qrPrice).toFixed(2),
    },
    daily: dailyBreakdown,
    monthly: monthlyBreakdown,
    previousPeriods,
    totalCertificates: totalCount.count,
    totalCost: (totalCount.count * qrPrice).toFixed(2),
  });
}
