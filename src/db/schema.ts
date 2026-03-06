import { pgTable, serial, text, date, timestamp, integer, numeric } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const physicians = pgTable("physicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicalOfficers = pgTable("medical_officers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentTemplates = pgTable("document_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("certificate_template"),
  fileData: text("file_data").notNull(),
  pageCount: integer("page_count").notNull().default(1),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  qrPrice: numeric("qr_price", { precision: 10, scale: 2 }).notNull().default("0.40"),
  credits: integer("credits").notNull().default(0),
  billingPaidUntil: date("billing_paid_until"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
