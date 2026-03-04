import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;
  const num = parseInt(certNumber);

  if (isNaN(num)) {
    return NextResponse.json({ error: "Invalid certificate number" }, { status: 400 });
  }

  const [cert] = await db
    .select({ qrCode: certificates.qrCode })
    .from(certificates)
    .where(eq(certificates.certificateNumber, num));

  if (!cert || !cert.qrCode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // qrCode is "data:image/png;base64,..."
  const base64Data = cert.qrCode.split(",")[1];
  const imageBuffer = Buffer.from(base64Data, "base64");

  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
