ALTER TABLE "purchase_orders" ADD COLUMN "received" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "backorder" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "ship_via";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "ship_to_address";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "ship_to_city";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "ship_to_state";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "ship_to_zip";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "freight";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "boxing_charges";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "po_amount";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "tax_rate";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "taxable";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "warranty_years";--> statement-breakpoint
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "delivery_date";
ALTER TABLE "purchase_orders" DROP COLUMN IF EXISTS "job_number";