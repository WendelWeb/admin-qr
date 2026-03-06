import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

function getNextBillingDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  if (day >= 4) {
    // Next 4th is next month
    const next = new Date(year, month + 1, 4);
    return next.toISOString().split("T")[0];
  } else {
    // Next 4th is this month
    const next = new Date(year, month, 4);
    return next.toISOString().split("T")[0];
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
  const isExpired = !billingPaidUntil || billingPaidUntil < today;

  return NextResponse.json({
    billingPaidUntil,
    isExpired,
    nextBillingDate: getNextBillingDate(),
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
