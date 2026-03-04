import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { medicalOfficers } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db.select().from(medicalOfficers).orderBy(asc(medicalOfficers.name));
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const [created] = await db.insert(medicalOfficers).values({ name: name.trim() }).returning();
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "This medical officer already exists" }, { status: 409 });
  }
}
