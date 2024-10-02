CREATE TABLE IF NOT EXISTS "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"equpipmentName" text NOT NULL,
	"sortOrder" integer NOT NULL,
	"costPerDay" integer NOT NULL,
	"costPerWeek" integer NOT NULL,
	"costPerMonth" integer NOT NULL,
	"deliveryFee" integer NOT NULL,
	"pickupFee" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "equipment_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "equipment" ADD CONSTRAINT "equipment_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activities" ADD CONSTRAINT "activities_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
