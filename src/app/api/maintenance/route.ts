import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

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
      .set({ maintenanceMode: !!enabled, updatedAt: new Date() })
      .where(eq(settings.id, config.id));
  } else {
    await db.insert(settings).values({ maintenanceMode: !!enabled });
  }

  return NextResponse.json({ maintenanceMode: !!enabled });
}
