import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [cert] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, parseInt(id)));

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  return NextResponse.json(cert);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db
    .delete(certificates)
    .where(eq(certificates.id, parseInt(id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
