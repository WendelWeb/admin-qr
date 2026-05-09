import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Public read — both apps need to know whether the project is disconnected.
export async function GET() {
  const [config] = await db.select().from(settings).limit(1);
  return NextResponse.json({ devDisconnected: !!config?.devDisconnected });
}

// Toggle — super_admin only.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { enabled } = await req.json();

  const [config] = await db.select().from(settings).limit(1);
  if (config) {
    await db
      .update(settings)
      .set({ devDisconnected: !!enabled, updatedAt: new Date() })
      .where(eq(settings.id, config.id));
  } else {
    await db.insert(settings).values({ devDisconnected: !!enabled });
  }

  return NextResponse.json({ devDisconnected: !!enabled });
}
