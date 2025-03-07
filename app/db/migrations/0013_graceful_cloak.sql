CREATE TABLE "panel_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"blade_width" numeric(10, 2) DEFAULT '0.25',
	"allow_rotation" boolean DEFAULT true,
	"results_json" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "panel_placements" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"panel_id" integer,
	"sheet_id" integer,
	"sheet_no" integer NOT NULL,
	"x" numeric(10, 2) NOT NULL,
	"y" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"rotated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "panel_sheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"qty" integer NOT NULL,
	"material" varchar(100),
	"thickness" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "panels" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"job_id" integer,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"qty" integer NOT NULL,
	"mark_no" varchar(100),
	"finish" varchar(100),
	"material" varchar(100),
	"allow_rotation" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "used_sheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"sheet_id" integer,
	"sheet_no" integer NOT NULL,
	"used_area" numeric(10, 2) NOT NULL,
	"waste_percentage" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "panel_jobs" ADD CONSTRAINT "panel_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_placements" ADD CONSTRAINT "panel_placements_job_id_panel_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."panel_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_placements" ADD CONSTRAINT "panel_placements_panel_id_panels_id_fk" FOREIGN KEY ("panel_id") REFERENCES "public"."panels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_placements" ADD CONSTRAINT "panel_placements_sheet_id_panel_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."panel_sheets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panel_sheets" ADD CONSTRAINT "panel_sheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panels" ADD CONSTRAINT "panels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "panels" ADD CONSTRAINT "panels_job_id_panel_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."panel_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "used_sheets" ADD CONSTRAINT "used_sheets_job_id_panel_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."panel_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "used_sheets" ADD CONSTRAINT "used_sheets_sheet_id_panel_sheets_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."panel_sheets"("id") ON DELETE no action ON UPDATE no action;