CREATE TABLE "grid_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"opening_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT false,
	"columns" integer NOT NULL,
	"rows" integer NOT NULL,
	"mullion_width" numeric(10, 2) NOT NULL,
	"total_mullion_length" numeric(10, 2) DEFAULT '0.00',
	"total_glass_area" numeric(10, 2) DEFAULT '0.00',
	"estimated_cost" numeric(10, 2) DEFAULT '0.00',
	"created_by" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grid_glass_panels" (
	"id" serial PRIMARY KEY NOT NULL,
	"opening_id" integer NOT NULL,
	"grid_column" integer NOT NULL,
	"grid_row" integer NOT NULL,
	"x" numeric(10, 2) NOT NULL,
	"y" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"is_transom" boolean DEFAULT false,
	"glass_type" varchar(100) DEFAULT 'Standard',
	"is_active" boolean DEFAULT true,
	"area" numeric(10, 2),
	"unit_cost" numeric(10, 2) DEFAULT '0.00',
	"total_cost" numeric(10, 2) DEFAULT '0.00',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grid_mullions" (
	"id" serial PRIMARY KEY NOT NULL,
	"opening_id" integer NOT NULL,
	"grid_type" varchar(20) NOT NULL,
	"grid_column" integer,
	"grid_row" integer,
	"length" numeric(10, 2) NOT NULL,
	"component_name" varchar(100) NOT NULL,
	"default_position" numeric(10, 2),
	"custom_position" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "grid_configurations" ADD CONSTRAINT "grid_configurations_opening_id_openings_id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."openings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_glass_panels" ADD CONSTRAINT "grid_glass_panels_opening_id_openings_id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."openings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grid_mullions" ADD CONSTRAINT "grid_mullions_opening_id_openings_id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."openings"("id") ON DELETE cascade ON UPDATE no action;