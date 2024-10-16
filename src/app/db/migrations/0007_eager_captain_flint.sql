CREATE TABLE IF NOT EXISTS "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"po_number" text NOT NULL,
	"job_number" text NOT NULL,
	"project_manager" text NOT NULL,
	"po_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"ship_via" text,
	"ship_to" text,
	"ship_to_address" text,
	"ship_to_city" text,
	"ship_to_state" text,
	"ship_to_zip" text,
	"cost_code" text NOT NULL,
	"freight" integer DEFAULT 0 NOT NULL,
	"boxing_charges" integer DEFAULT 0 NOT NULL,
	"po_amount" integer NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '9.75' NOT NULL,
	"taxable" boolean DEFAULT true NOT NULL,
	"warranty_years" integer,
	"short_description" text NOT NULL,
	"long_description" text,
	"notes" text,
	"delivery_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_name" text NOT NULL,
	"vendor_address" text NOT NULL,
	"vendor_city" text NOT NULL,
	"vendor_state" text NOT NULL,
	"vendor_zip" text NOT NULL,
	"vendor_phone" text,
	"vendor_email" text,
	"vendor_contact" text,
	"internal_vendor_id" text,
	"taxable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
