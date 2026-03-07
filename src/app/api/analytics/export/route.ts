import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { sql, gte, lte, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");

  const conditions = [];
  if (from) conditions.push(sql`${certificates.createdAt}::date >= ${from}::date`);
  if (to) conditions.push(sql`${certificates.createdAt}::date <= ${to}::date`);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      id: certificates.id,
      name: certificates.name,
      certificateNumber: certificates.certificateNumber,
      accessCode: certificates.accessCode,
      dateOfBirth: certificates.dateOfBirth,
      dateIssued: certificates.dateIssued,
      expiryDate: certificates.expiryDate,
      country: certificates.country,
      examiningPhysician: certificates.examiningPhysician,
      medicalOfficer: certificates.medicalOfficer,
      createdBy: certificates.createdBy,
      createdAt: certificates.createdAt,
    })
    .from(certificates)
    .where(whereClause)
    .orderBy(desc(certificates.createdAt));

  const today = new Date().toISOString().split("T")[0];

  const headers = [
    "ID", "Name", "Certificate Number", "Access Code", "Date of Birth",
    "Date Issued", "Expiry Date", "Status", "Country",
    "Examining Physician", "Medical Officer", "Created By", "Created At",
  ];

  const rows = results.map((r) => [
    r.id,
    r.name,
    r.certificateNumber,
    r.accessCode,
    r.dateOfBirth,
    r.dateIssued,
    r.expiryDate,
    r.expiryDate >= today ? "Active" : "Expired",
    r.country,
    r.examiningPhysician,
    r.medicalOfficer,
    r.createdBy || "Unknown",
    r.createdAt ? new Date(r.createdAt).toISOString() : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="certificates-${from || "all"}-to-${to || "all"}.csv"`,
    },
  });
}
