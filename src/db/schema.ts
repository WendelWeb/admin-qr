import { pgTable, serial, text, date, timestamp, integer } from "drizzle-orm/pg-core";

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  certificateNumber: integer("certificate_number").notNull().unique(),
  accessCode: text("access_code").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  dateIssued: date("date_issued").notNull(),
  expiryDate: date("expiry_date").notNull(),
  country: text("country").notNull().default("Turks and Caicos Islands"),
  examiningPhysician: text("examining_physician").notNull(),
  medicalOfficer: text("medical_officer").notNull(),
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
