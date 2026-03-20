import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { desc, isNotNull, or, ilike, sql, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "super_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search") || "";

  let results;
  if (search) {
    results = await db
      .select()
      .from(certificates)
      .where(
        and(
          isNotNull(certificates.deletedAt),
          or(
            ilike(certificates.name, `%${search}%`),
            ilike(certificates.accessCode, `%${search}%`),
            ilike(certificates.country, `%${search}%`),
            ilike(certificates.examiningPhysician, `%${search}%`),
            ilike(certificates.medicalOfficer, `%${search}%`),
            ilike(certificates.deletedBy, `%${search}%`),
            sql`CAST(${certificates.certificateNumber} AS TEXT) ILIKE ${`%${search}%`}`,
            sql`CAST(${certificates.dateIssued} AS TEXT) ILIKE ${`%${search}%`}`
          )
        )
      )
      .orderBy(desc(certificates.deletedAt));
  } else {
    results = await db
      .select()
      .from(certificates)
      .where(isNotNull(certificates.deletedAt))
      .orderBy(desc(certificates.deletedAt));
  }

  return NextResponse.json(results);
}
