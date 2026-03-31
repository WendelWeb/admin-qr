import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { settings, certificates } from "@/db/schema";
import { eq, sql, gte, lte, and } from "drizzle-orm";

// Internal billing day (actual trigger) vs display day (shown in UI)
const BILLING_DAY = 2;
const PERIOD_END_DAY = 1;
const DISPLAY_BILLING_DAY = 4;
const DISPLAY_PERIOD_END_DAY = 3;

function getNextBillingDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (day >= BILLING_DAY) {
    return new Date(year, month + 1, BILLING_DAY).toISOString().split("T")[0];
  } else {
    return new Date(year, month, BILLING_DAY).toISOString().split("T")[0];
  }
}

function getNextBillingDateDisplay() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (day >= BILLING_DAY) {
    return new Date(year, month + 1, DISPLAY_BILLING_DAY).toISOString().split("T")[0];
  } else {
    return new Date(year, month, DISPLAY_BILLING_DAY).toISOString().split("T")[0];
  }
}

function toDisplayDate(internalDate: string | null): string | null {
  if (!internalDate) return null;
  const d = new Date(internalDate + "T00:00:00");
  d.setDate(d.getDate() + (DISPLAY_BILLING_DAY - BILLING_DAY));
  return d.toISOString().split("T")[0];
}

// Get the billing period that just ended (previous period)
function getLastBillingPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (day >= BILLING_DAY) {
    return {
      start: new Date(year, month - 1, BILLING_DAY),
      end: new Date(year, month, PERIOD_END_DAY, 23, 59, 59, 999),
      displayStart: new Date(year, month - 1, DISPLAY_BILLING_DAY),
      displayEnd: new Date(year, month, DISPLAY_PERIOD_END_DAY, 23, 59, 59, 999),
    };
  } else {
    return {
      start: new Date(year, month - 2, BILLING_DAY),
      end: new Date(year, month - 1, PERIOD_END_DAY, 23, 59, 59, 999),
      displayStart: new Date(year, month - 2, DISPLAY_BILLING_DAY),
      displayEnd: new Date(year, month - 1, DISPLAY_PERIOD_END_DAY, 23, 59, 59, 999),
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

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const periodLabel = `${months[lastPeriod.displayStart.getMonth()]} ${lastPeriod.displayStart.getDate()}, ${lastPeriod.displayStart.getFullYear()} — ${months[lastPeriod.displayEnd.getMonth()]} ${lastPeriod.displayEnd.getDate()}, ${lastPeriod.displayEnd.getFullYear()}`;

    billingSummary = {
      periodLabel,
      periodStart: lastPeriod.displayStart.toISOString().split("T")[0],
      periodEnd: lastPeriod.displayEnd.toISOString().split("T")[0],
      qrCertCount,
      qrUnitPrice: qrPrice,
      qrTotal,
      docspringCost,
      vpsCost,
      grandTotal,
    };
  }

  return NextResponse.json({
    billingPaidUntil: toDisplayDate(billingPaidUntil),
    isExpired,
    maintenanceMode: config?.maintenanceMode ?? false,
    nextBillingDate: getNextBillingDateDisplay(),
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
    billingPaidUntil: toDisplayDate(nextDate),
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
    billingPaidUntil: toDisplayDate(today),
    isExpired: true,
  });
}
