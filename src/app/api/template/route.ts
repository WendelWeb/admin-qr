import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { documentTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [template] = await db
    .select({ id: documentTemplates.id, name: documentTemplates.name, pageCount: documentTemplates.pageCount, uploadedAt: documentTemplates.uploadedAt })
    .from(documentTemplates)
    .limit(1);

  if (!template) {
    return NextResponse.json({ template: null });
  }

  return NextResponse.json({ template });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  // Count pages using pdf-lib
  let pageCount = 1;
  try {
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.load(buffer);
    pageCount = pdfDoc.getPageCount();
  } catch {
    // Default to 1 if parsing fails
  }

  // Delete existing template(s) and insert new one
  await db.delete(documentTemplates);
  await db.insert(documentTemplates).values({
    name: file.name,
    fileData: base64,
    pageCount,
  });

  return NextResponse.json({ success: true, name: file.name, pageCount });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(documentTemplates);
  return NextResponse.json({ success: true });
}
