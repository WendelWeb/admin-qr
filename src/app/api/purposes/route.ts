import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { purposeOptions } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({ id: purposeOptions.id, value: purposeOptions.value })
    .from(purposeOptions)
    .orderBy(asc(purposeOptions.value));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { value } = await req.json();
  const v = String(value ?? "").trim().toUpperCase();
  if (!v) {
    return NextResponse.json({ error: "Value is required" }, { status: 400 });
  }
  if (v.length > 80) {
    return NextResponse.json({ error: "Value is too long" }, { status: 400 });
  }

  try {
    const [row] = await db
      .insert(purposeOptions)
      .values({ value: v })
      .returning({ id: purposeOptions.id, value: purposeOptions.value });
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "This value already exists" }, { status: 409 });
  }
}
