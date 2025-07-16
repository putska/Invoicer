CREATE TYPE "public"."holiday_type" AS ENUM('field', 'office', 'both');--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "holiday_type" NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_holidays_date_type" ON "holidays" USING btree ("date","type");--> statement-breakpoint
CREATE INDEX "idx_holidays_date" ON "holidays" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_holidays_type" ON "holidays" USING btree ("type");