CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"certificate_number" integer NOT NULL,
	"access_code" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"date_issued" date NOT NULL,
	"expiry_date" date NOT NULL,
	"country" text DEFAULT 'Turks and Caicos Islands' NOT NULL,
	"examining_physician" text NOT NULL,
	"medical_officer" text NOT NULL,
	"qr_code" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text,
	CONSTRAINT "certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'certificate_template' NOT NULL,
	"file_data" text NOT NULL,
	"page_count" integer DEFAULT 1 NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_officers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "medical_officers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "physicians" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "physicians_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"qr_price" numeric(10, 2) DEFAULT '0.40' NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"billing_paid_until" date,
	"maintenance_mode" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
