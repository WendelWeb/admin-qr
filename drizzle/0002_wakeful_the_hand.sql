CREATE TABLE "purpose_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purpose_options_value_unique" UNIQUE("value")
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "system" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "employer_name" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "purpose_of_residency" text;