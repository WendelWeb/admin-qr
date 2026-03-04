import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [config] = await db.select().from(settings).limit(1);
  return NextResponse.json({ qrPrice: config?.qrPrice ?? "1.50" });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only super_admin can change the price
  if (session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { qrPrice } = await req.json();
  const price = parseFloat(qrPrice);

  if (isNaN(price) || price <= 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const [config] = await db.select().from(settings).limit(1);

  if (config) {
    await db
      .update(settings)
      .set({ qrPrice: price.toFixed(2), updatedAt: new Date() })
      .where(eq(settings.id, config.id));
  } else {
    await db.insert(settings).values({ qrPrice: price.toFixed(2) });
  }

  return NextResponse.json({ success: true, qrPrice: price.toFixed(2) });
}
