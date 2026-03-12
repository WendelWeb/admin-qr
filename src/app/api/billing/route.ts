import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { settings, certificates } from "@/db/schema";
import { eq, sql, gte, lte, and } from "drizzle-orm";

function getNextBillingDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (day >= 4) {
    const next = new Date(year, month + 1, 4);
    return next.toISOString().split("T")[0];
  } else {
    const next = new Date(year, month, 4);
    return next.toISOString().split("T")[0];
  }
}

// Get the billing period that just ended (previous period)
function getLastBillingPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (day >= 4) {
    // We are past the 4th — last period: 4th of previous month to 3rd of this month
    return {
      start: new Date(year, month - 1, 4),
      end: new Date(year, month, 3, 23, 59, 59, 999),
    };
  } else {
    // Before the 4th — last period: 4th of two months ago to 3rd of last month
    return {
      start: new Date(year, month - 2, 4),
      end: new Date(year, month - 1, 3, 23, 59, 59, 999),
    };
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config] = await db.select().from(settings).limit(1);
  const billingPaidUntil = config?.billingPaidUntil ?? null;

  const today = new Date().toISOString().split("T")[0];
  const isExpired = !billingPaidUntil || billingPaidUntil <= today;

  // Compute billing summary when expired
  let billingSummary = null;
  if (isExpired) {
    const lastPeriod = getLastBillingPeriod();
    const qrPrice = parseFloat(config?.qrPrice ?? "1.50");

    const [periodCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(certificates)
      .where(
        and(
          gte(certificates.createdAt, lastPeriod.start),
          lte(certificates.createdAt, lastPeriod.end)
        )
      );

    const qrCertCount = periodCount?.count ?? 0;
    const qrTotal = (qrCertCount * qrPrice).toFixed(2);
    const docspringCost = "249.00";
    const vpsCost = "399.00";
    const grandTotal = (qrCertCount * qrPrice + 249 + 399).toFixed(2);

    const formatD = (d: Date) => d.toISOString().split("T")[0];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const periodLabel = `${months[lastPeriod.start.getMonth()]} ${lastPeriod.start.getDate()}, ${lastPeriod.start.getFullYear()} — ${months[lastPeriod.end.getMonth()]} ${lastPeriod.end.getDate()}, ${lastPeriod.end.getFullYear()}`;

    billingSummary = {
      periodLabel,
      periodStart: formatD(lastPeriod.start),
      periodEnd: formatD(lastPeriod.end),
      qrCertCount,
      qrUnitPrice: qrPrice,
      qrTotal,
      docspringCost,
      vpsCost,
      grandTotal,
    };
  }

  return NextResponse.json({
    billingPaidUntil,
    isExpired,
    maintenanceMode: config?.maintenanceMode ?? false,
    nextBillingDate: getNextBillingDate(),
    billingSummary,
  });
}

// Super admin confirms payment
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nextDate = getNextBillingDate();

  const [config] = await db.select().from(settings).limit(1);
  if (config) {
    await db
      .update(settings)
      .set({ billingPaidUntil: nextDate, updatedAt: new Date() })
      .where(eq(settings.id, config.id));
  } else {
    await db.insert(settings).values({ billingPaidUntil: nextDate });
  }

  return NextResponse.json({
    billingPaidUntil: nextDate,
    isExpired: false,
  });
}

// Super admin simulates billing expiration (for testing)
export async function PATCH() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date().toISOString().split("T")[0];

  const [config] = await db.select().from(settings).limit(1);
  if (config) {
    await db
      .update(settings)
      .set({
        billingPaidUntil: today,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, config.id));
  }

  return NextResponse.json({
    success: true,
    billingPaidUntil: today,
    isExpired: true,
  });
}
