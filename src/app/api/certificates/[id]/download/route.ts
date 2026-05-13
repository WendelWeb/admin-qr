import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const DOCSPRING_TOKEN_ID = "api_Jx72Zxtk6dMyYZ739H";
const DOCSPRING_TOKEN_SECRET = "9tKdzcmS4qctmatMD2AT3MmHTr59X4qNNxXGQbmxeb";
const DOCSPRING_TEMPLATE_ID_LEGACY = "tpl_m9by23NrfhptCLjpLd";
const DOCSPRING_TEMPLATE_ID_NEW = "tpl_N5kEELcbHXQm6q7NnD";

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
    .where(and(eq(certificates.id, parseInt(id)), isNull(certificates.deletedAt)));

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  // Prepare QR code for DocSpring (base64 without the data URL prefix)
  let qrBase64 = "";
  if (cert.qrCode) {
    qrBase64 = cert.qrCode.split(",")[1] || "";
  }

  const isNewSystem = cert.system === "new";
  const templateId = isNewSystem ? DOCSPRING_TEMPLATE_ID_NEW : DOCSPRING_TEMPLATE_ID_LEGACY;

  // Build data matching DocSpring template field names. The two templates
  // use different (and partially typo'd) keys, so we map each explicitly.
  const submissionData: Record<string, unknown> = isNewSystem
    ? {
        "NAME": cert.name,
        // The new template still has a typo on this label ("CERTFICATE"),
        // so we must send under that exact key.
        "CERTFICATE NUMBER": String(cert.certificateNumber),
        "ACCESS CODE": cert.accessCode,
        "DATE OF BIRTH": formatDateShort(cert.dateOfBirth),
        "DATE ISSUED": formatDateFull(cert.dateIssued),
        "EXPIRY DATE": formatDateFull(cert.expiryDate),
        "EMPLOYER NAME": cert.employerName || "",
        "PURPOSE OF RESIDENCY": cert.purposeOfResidency || "",
        // Unnamed checkbox in the template — left unchecked until we know
        // what it represents.
        "field7": false,
      }
    : {
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
    `https://sync.api.docspring.com/api/v1/templates/${templateId}/submissions`,
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
    console.error("DocSpring error:", JSON.stringify(errorData));
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: errorData?.errors || errorData?.submission?.json_schema_errors || errorData,
      },
      { status: 500 }
    );
  }

  const result = await docspringRes.json();

  if (result.status === "success" && result.submission?.download_url) {
    // Fetch the generated PDF
    const pdfRes = await fetch(result.submission.download_url);
    const pdfBuffer = await pdfRes.arrayBuffer();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${cert.name}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "PDF generation failed", details: result }, { status: 500 });
}
