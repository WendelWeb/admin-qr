import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import QRCode from "qrcode";
import * as schema from "./src/db/schema";
import { eq } from "drizzle-orm";

const MAIN_SITE_URL = "https://healthcertificategov-tc.org";

async function fixQrCodes() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const allCerts = await db.select().from(schema.certificates);
  console.log(`Found ${allCerts.length} certificates to fix`);

  for (const cert of allCerts) {
    const validationUrl = `${MAIN_SITE_URL}/certificates/validate?certification=${cert.certificateNumber}`;

    const newQr = await QRCode.toDataURL(validationUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });

    await db
      .update(schema.certificates)
      .set({ qrCode: newQr })
      .where(eq(schema.certificates.id, cert.id));

    console.log(`Fixed #${cert.certificateNumber} → ${validationUrl}`);
  }

  console.log("All QR codes updated!");
}

fixQrCodes().catch(console.error);
