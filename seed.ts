import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "./src/db/schema";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const superAdminHash = await bcrypt.hash("Wendel509&%$", 12);

  await db.insert(schema.users).values({
    email: "stanleywendeljoseph@gmail.com",
    passwordHash: superAdminHash,
    role: "super_admin",
  }).onConflictDoNothing();

  // Seed default settings (QR price)
  await db.insert(schema.settings).values({
    qrPrice: "1.50",
  }).onConflictDoNothing();

  console.log("Super admin seeded successfully!");
  console.log("Email: stanleywendeljoseph@gmail.com");
  console.log("Default QR price: $1.50");
}

seed().catch(console.error);
