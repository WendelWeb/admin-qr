import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { purposeOptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numericId = parseInt(id);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await db.delete(purposeOptions).where(eq(purposeOptions.id, numericId));
  return NextResponse.json({ ok: true });
}
