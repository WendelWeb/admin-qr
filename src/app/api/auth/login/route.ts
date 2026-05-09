import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { db } from "@/db";
import { users, settings } from "@/db/schema";
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

  // Block sign-in for regular admins when the dev has disconnected the project.
  // Super admins can still log in so they can lift the lockdown.
  if (user.role !== "super_admin") {
    const [config] = await db.select().from(settings).limit(1);
    if (config?.devDisconnected) {
      return NextResponse.json(
        { error: "Service unavailable", code: "DEV_DISCONNECTED" },
        { status: 503 }
      );
    }
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
