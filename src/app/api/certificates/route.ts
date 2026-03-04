import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { desc, or, ilike, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generateAccessCode } from "@/lib/generate-access-code";
import { generateQrCode } from "@/lib/generate-qr-code";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";

  let results;
  if (search) {
    results = await db
      .select()
      .from(certificates)
      .where(
        or(
          ilike(certificates.name, `%${search}%`),
          ilike(certificates.accessCode, `%${search}%`),
          ilike(certificates.country, `%${search}%`),
          ilike(certificates.examiningPhysician, `%${search}%`),
          ilike(certificates.medicalOfficer, `%${search}%`),
          sql`CAST(${certificates.certificateNumber} AS TEXT) ILIKE ${`%${search}%`}`,
          sql`CAST(${certificates.dateOfBirth} AS TEXT) ILIKE ${`%${search}%`}`,
          sql`CAST(${certificates.dateIssued} AS TEXT) ILIKE ${`%${search}%`}`,
          sql`CAST(${certificates.expiryDate} AS TEXT) ILIKE ${`%${search}%`}`
        )
      )
      .orderBy(desc(certificates.createdAt));
  } else {
    results = await db
      .select()
      .from(certificates)
      .orderBy(desc(certificates.createdAt));
  }

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, dateOfBirth, dateIssued, validityYears, country, examiningPhysician, medicalOfficer } = body;

  if (!dateIssued) {
    return NextResponse.json({ error: "Date issued is required" }, { status: 400 });
  }

  // Get next certificate number
  const [maxResult] = await db
    .select({ max: sql<number>`COALESCE(MAX(${certificates.certificateNumber}), 88714999)` })
    .from(certificates);
  const nextNumber = (maxResult?.max ?? 88714999) + 1;

  // Generate access code
  const accessCode = generateAccessCode();

  // Compute expiry date based on chosen validity (1, 2, or 3 years)
  const issuedDate = new Date(dateIssued + "T00:00:00");
  const expiry = new Date(issuedDate);
  const years = parseInt(validityYears) || 2;
  expiry.setFullYear(expiry.getFullYear() + years);
  const expiryDate = expiry.toISOString().split("T")[0];

  // Generate QR code
  const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "https://healthcertificategov-tc.org";
  const validationUrl = `${mainSiteUrl}/certificates/validate?certification=${nextNumber}`;
  const qrCodeDataUrl = await generateQrCode(validationUrl);

  // Insert
  const [newCert] = await db.insert(certificates).values({
    name,
    certificateNumber: nextNumber,
    accessCode,
    dateOfBirth,
    dateIssued,
    expiryDate,
    country: country || "Turks and Caicos Islands",
    examiningPhysician,
    medicalOfficer,
    qrCode: qrCodeDataUrl,
  }).returning();

  return NextResponse.json(newCert, { status: 201 });
}
