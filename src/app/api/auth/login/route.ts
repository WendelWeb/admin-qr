import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({ email: user.email, role: user.role });
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return response;
}
