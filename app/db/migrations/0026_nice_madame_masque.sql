CREATE TABLE "bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"estimate_id" integer NOT NULL,
	"bid_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"stage" varchar(50) DEFAULT 'initial_budget' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_bid_id" integer,
	"prepared_by" varchar(255),
	"reviewed_by" varchar(255),
	"approved_by" varchar(255),
	"submitted_date" timestamp,
	"total_material_cost" numeric(12, 2) DEFAULT '0.00',
	"total_labor_cost" numeric(12, 2) DEFAULT '0.00',
	"total_subcontractor_cost" numeric(12, 2) DEFAULT '0.00',
	"total_equipment_cost" numeric(12, 2) DEFAULT '0.00',
	"total_overhead_cost" numeric(12, 2) DEFAULT '0.00',
	"total_profit_amount" numeric(12, 2) DEFAULT '0.00',
	"total_bid_amount" numeric(12, 2) DEFAULT '0.00',
	"overhead_percentage" numeric(5, 2) DEFAULT '10.00',
	"profit_percentage" numeric(5, 2) DEFAULT '8.00',
	"contingency_percentage" numeric(5, 2) DEFAULT '5.00',
	"proposed_start_date" timestamp,
	"proposed_completion_date" timestamp,
	"delivery_weeks" integer,
	"alternate_requested" boolean DEFAULT false,
	"alternate_description" text,
	"value_engineering_notes" text,
	"exclusions" text,
	"assumptions" text,
	"is_active" boolean DEFAULT true,
	"is_submitted" boolean DEFAULT false,
	"notes" text,
	"internal_notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "doors" (
	"id" serial PRIMARY KEY NOT NULL,
	"opening_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"door_mark" varchar(50),
	"position" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"door_type" varchar(50) NOT NULL,
	"handing_type" varchar(20),
	"has_vision" boolean DEFAULT true,
	"door_material" varchar(50),
	"lock_type" varchar(50),
	"closer_type" varchar(50),
	"has_automatic_operator" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "elevations" (
	"id" serial PRIMARY KEY NOT NULL,
	"bid_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"elevation_type" varchar(50) DEFAULT 'storefront' NOT NULL,
	"total_width" numeric(10, 2) NOT NULL,
	"total_height" numeric(10, 2) NOT NULL,
	"floor_height" numeric(10, 2) NOT NULL,
	"floor_number" integer DEFAULT 1,
	"drawing_number" varchar(50),
	"drawing_revision" varchar(10),
	"grid_line" varchar(50),
	"detail_reference" varchar(50),
	"material_cost" numeric(10, 2) DEFAULT '0.00',
	"labor_cost" numeric(10, 2) DEFAULT '0.00',
	"total_cost" numeric(10, 2) DEFAULT '0.00',
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" serial PRIMARY KEY NOT NULL,
	"estimate_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"building_type" varchar(100),
	"location" varchar(255),
	"architect" varchar(255),
	"contractor" varchar(255),
	"owner" varchar(255),
	"bid_date" timestamp,
	"project_start_date" timestamp,
	"project_end_date" timestamp,
	"total_square_footage" numeric(12, 2),
	"stories_below_grade" integer DEFAULT 0,
	"stories_above_grade" integer DEFAULT 1,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"estimated_value" numeric(12, 2),
	"confidence_level" varchar(20),
	"competition_level" varchar(20),
	"relationship_status" varchar(50),
	"primary_contact" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"assigned_estimator" varchar(255),
	"sales_person" varchar(255),
	"notes" text,
	"internal_notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "estimates_estimate_number_unique" UNIQUE("estimate_number")
);
--> statement-breakpoint
CREATE TABLE "glass_panels" (
	"id" serial PRIMARY KEY NOT NULL,
	"opening_id" integer NOT NULL,
	"panel_number" integer NOT NULL,
	"x" numeric(10, 2) NOT NULL,
	"y" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"area" numeric(10, 2) NOT NULL,
	"is_transom" boolean DEFAULT false,
	"is_operable" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mullions" (
	"id" serial PRIMARY KEY NOT NULL,
	"opening_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"position" numeric(10, 2) NOT NULL,
	"mullion_type" varchar(50) NOT NULL,
	"depth" numeric(10, 2) DEFAULT '2.00',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "openings" (
	"id" serial PRIMARY KEY NOT NULL,
	"elevation_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"opening_mark" varchar(50),
	"start_position" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"sill_height" numeric(10, 2) NOT NULL,
	"opening_type" varchar(50) NOT NULL,
	"glazing_system" varchar(100),
	"has_transom" boolean DEFAULT false,
	"transom_height" numeric(10, 2),
	"thermal_performance" varchar(50),
	"wind_load_requirement" varchar(50),
	"seismic_requirement" varchar(50),
	"acoustic_requirement" varchar(50),
	"quantity" integer DEFAULT 1,
	"unit_material_cost" numeric(10, 2) DEFAULT '0.00',
	"unit_labor_cost" numeric(10, 2) DEFAULT '0.00',
	"total_material_cost" numeric(10, 2) DEFAULT '0.00',
	"total_labor_cost" numeric(10, 2) DEFAULT '0.00',
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "special_conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"elevation_id" integer NOT NULL,
	"condition_type" varchar(50) NOT NULL,
	"position" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2),
	"height" numeric(10, 2),
	"angle" numeric(5, 2),
	"description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doors" ADD CONSTRAINT "doors_opening_id_openings_id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."openings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevations" ADD CONSTRAINT "elevations_bid_id_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."bids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glass_panels" ADD CONSTRAINT "glass_panels_opening_id_openings_id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."openings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mullions" ADD CONSTRAINT "mullions_opening_id_openings_id_fk" FOREIGN KEY ("opening_id") REFERENCES "public"."openings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "openings" ADD CONSTRAINT "openings_elevation_id_elevations_id_fk" FOREIGN KEY ("elevation_id") REFERENCES "public"."elevations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_conditions" ADD CONSTRAINT "special_conditions_elevation_id_elevations_id_fk" FOREIGN KEY ("elevation_id") REFERENCES "public"."elevations"("id") ON DELETE cascade ON UPDATE no action;