import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config] = await db.select().from(settings).limit(1);
  return NextResponse.json({ credits: config?.credits ?? 0 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { amount, action } = body;

  const [config] = await db.select().from(settings).limit(1);

  // Reset to 0
  if (action === "reset") {
    if (config) {
      await db.update(settings).set({ credits: 0, updatedAt: new Date() }).where(eq(settings.id, config.id));
    }
    return NextResponse.json({ credits: 0 });
  }

  // Set to exact value
  if (action === "set") {
    const val = parseInt(amount);
    if (isNaN(val) || val < 0) {
      return NextResponse.json({ error: "Amount must be 0 or more" }, { status: 400 });
    }
    if (config) {
      await db.update(settings).set({ credits: val, updatedAt: new Date() }).where(eq(settings.id, config.id));
    } else {
      await db.insert(settings).values({ credits: val });
    }
    return NextResponse.json({ credits: val });
  }

  // Default: add credits
  const add = parseInt(amount);
  if (isNaN(add) || add <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  if (config) {
    const newCredits = (config.credits ?? 0) + add;
    await db
      .update(settings)
      .set({ credits: newCredits, updatedAt: new Date() })
      .where(eq(settings.id, config.id));
    return NextResponse.json({ credits: newCredits });
  } else {
    await db.insert(settings).values({ credits: add });
    return NextResponse.json({ credits: add });
  }
}
