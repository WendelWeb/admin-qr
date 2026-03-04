import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";

const DOCSPRING_TOKEN_ID = "api_Jx72Zxtk6dMyYZ739H";
const DOCSPRING_TOKEN_SECRET = "9tKdzcmS4qctmatMD2AT3MmHTr59X4qNNxXGQbmxeb";
const DOCSPRING_TEMPLATE_ID = "tpl_m9by23NrfhptCLjpLd";

const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthsFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Date of birth: "15 Mar 1994"
function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
}

// Date issued / Expiry: "05, November 2025"
function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}, ${monthsFull[d.getMonth()]} ${d.getFullYear()}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get certificate
  const [cert] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, parseInt(id)));

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  // Prepare QR code for DocSpring (base64 without the data URL prefix)
  let qrBase64 = "";
  if (cert.qrCode) {
    qrBase64 = cert.qrCode.split(",")[1] || "";
  }

  // Build data matching DocSpring template field names
  const submissionData: Record<string, unknown> = {
    "FULL NAME": cert.name,
    "CERTIFICATE NUMBER": cert.certificateNumber,
    "ACESS CODE": cert.accessCode,
    "DATE OF BIRTH": formatDateShort(cert.dateOfBirth),
    "DATE ISSUED": formatDateFull(cert.dateIssued),
    "EXPIRY DATE": formatDateFull(cert.expiryDate),
  };

  if (qrBase64) {
    submissionData["QRCODE"] = { base64: qrBase64 };
  }

  // Call DocSpring synchronous API
  const auth = Buffer.from(`${DOCSPRING_TOKEN_ID}:${DOCSPRING_TOKEN_SECRET}`).toString("base64");

  const docspringRes = await fetch(
    `https://sync.api.docspring.com/api/v1/templates/${DOCSPRING_TEMPLATE_ID}/submissions`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: submissionData,
        test: false,
      }),
    }
  );

  if (!docspringRes.ok) {
    const errorData = await docspringRes.json();
    console.error("DocSpring error:", errorData);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }

  const result = await docspringRes.json();

  if (result.status === "success" && result.submission?.download_url) {
    // Fetch the generated PDF
    const pdfRes = await fetch(result.submission.download_url);
    const pdfBuffer = await pdfRes.arrayBuffer();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${cert.certificateNumber}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "PDF generation failed", details: result }, { status: 500 });
}
