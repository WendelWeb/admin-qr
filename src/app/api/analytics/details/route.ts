import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { sql, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const results = await db
    .select({
      id: certificates.id,
      name: certificates.name,
      certificateNumber: certificates.certificateNumber,
      country: certificates.country,
      examiningPhysician: certificates.examiningPhysician,
      medicalOfficer: certificates.medicalOfficer,
      dateIssued: certificates.dateIssued,
      expiryDate: certificates.expiryDate,
      createdBy: certificates.createdBy,
      createdAt: certificates.createdAt,
    })
    .from(certificates)
    .where(
      and(
        sql`${certificates.createdAt}::date >= ${from}::date`,
        sql`${certificates.createdAt}::date <= ${to}::date`
      )
    )
    .orderBy(desc(certificates.createdAt));

  return NextResponse.json(results);
}
