import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const list = await db
    .select({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, password } = await req.json();

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    const [created] = await db.insert(users).values({
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      role: "admin",
    }).returning({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "This email already exists" }, { status: 409 });
  }
}
