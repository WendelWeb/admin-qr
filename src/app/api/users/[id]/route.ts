import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { password } = await req.json();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // Don't allow modifying super_admin accounts
  const [target] = await db.select().from(users).where(eq(users.id, parseInt(id)));
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "super_admin") {
    return NextResponse.json({ error: "Cannot modify super admin from here" }, { status: 403 });
  }

  const hash = await bcrypt.hash(password, 12);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, parseInt(id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Don't allow deleting super_admin accounts
  const [target] = await db.select().from(users).where(eq(users.id, parseInt(id)));
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "super_admin") {
    return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });
  }

  await db.delete(users).where(eq(users.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
