ALTER TABLE "openings" ADD COLUMN "grid_columns" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "grid_rows" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "mullion_width" numeric(10, 2) DEFAULT '2.50';--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "spacing_vertical" varchar(20) DEFAULT 'equal';--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "spacing_horizontal" varchar(20) DEFAULT 'equal';--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "component_sill" varchar(100) DEFAULT 'Sill';--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "component_head" varchar(100) DEFAULT 'Head';--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "component_jambs" varchar(100) DEFAULT 'Jamb';--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "component_verticals" varchar(100) DEFAULT 'Vertical';--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "component_horizontals" varchar(100) DEFAULT 'Horizontal';--> statement-breakpoint
ALTER TABLE "openings" ADD COLUMN "description" text;