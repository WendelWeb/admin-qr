import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { certificates, documentTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Field positions on the PDF template (x, y from bottom-left)
// Adjust these values to match your template layout
const FIELD_CONFIG = {
  name:                { x: 230, y: 582, size: 11 },
  certificateNumber:   { x: 230, y: 556, size: 11 },
  accessCode:          { x: 230, y: 530, size: 11 },
  dateOfBirth:         { x: 230, y: 504, size: 11 },
  dateIssued:          { x: 230, y: 478, size: 11 },
  expiryDate:          { x: 230, y: 452, size: 11 },
  country:             { x: 230, y: 426, size: 11 },
  examiningPhysician:  { x: 230, y: 400, size: 11 },
  medicalOfficer:      { x: 230, y: 374, size: 11 },
  qrCode:              { x: 420, y: 340, width: 120, height: 120 },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
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

  // Get template
  const [template] = await db.select().from(documentTemplates).limit(1);

  let pdfDoc: PDFDocument;

  if (template) {
    // Load uploaded template as background
    const templateBytes = Buffer.from(template.fileData, "base64");
    pdfDoc = await PDFDocument.load(templateBytes);
  } else {
    // Create blank PDF if no template
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595, 842]); // A4
  }

  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textColor = rgb(0.1, 0.1, 0.1);

  // Draw text fields
  const fields: { key: keyof typeof FIELD_CONFIG; value: string }[] = [
    { key: "name", value: cert.name },
    { key: "certificateNumber", value: String(cert.certificateNumber) },
    { key: "accessCode", value: cert.accessCode },
    { key: "dateOfBirth", value: formatDate(cert.dateOfBirth) },
    { key: "dateIssued", value: formatDate(cert.dateIssued) },
    { key: "expiryDate", value: formatDate(cert.expiryDate) },
    { key: "country", value: cert.country },
    { key: "examiningPhysician", value: cert.examiningPhysician },
    { key: "medicalOfficer", value: cert.medicalOfficer },
  ];

  for (const field of fields) {
    const config = FIELD_CONFIG[field.key];
    if ("size" in config) {
      page.drawText(field.value, {
        x: config.x,
        y: config.y,
        size: config.size,
        font,
        color: textColor,
      });
    }
  }

  // Draw QR code if available
  if (cert.qrCode) {
    try {
      // qrCode is a base64 data URL like "data:image/png;base64,..."
      const base64Data = cert.qrCode.split(",")[1];
      const qrBytes = Buffer.from(base64Data, "base64");
      const qrImage = await pdfDoc.embedPng(qrBytes);

      const qrConfig = FIELD_CONFIG.qrCode;
      page.drawImage(qrImage, {
        x: qrConfig.x,
        y: qrConfig.y,
        width: qrConfig.width,
        height: qrConfig.height,
      });
    } catch {
      // Skip QR if embedding fails
    }
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${cert.certificateNumber}.pdf"`,
    },
  });
}
