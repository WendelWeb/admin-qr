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

  const { amount } = await req.json();
  const add = parseInt(amount);

  if (isNaN(add) || add <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  const [config] = await db.select().from(settings).limit(1);

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
