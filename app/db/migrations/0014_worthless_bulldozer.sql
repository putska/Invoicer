CREATE TABLE "glass" (
	"id" serial PRIMARY KEY NOT NULL,
	"marknum" text NOT NULL,
	"markindex" text NOT NULL,
	"gtype" text NOT NULL,
	"width" text NOT NULL,
	"height" text NOT NULL,
	"height2" text DEFAULT '0' NOT NULL,
	"dlowidth" text NOT NULL,
	"dloheight" text NOT NULL,
	"dloheight2" text DEFAULT '0' NOT NULL,
	"left" text DEFAULT '0',
	"right" text DEFAULT '0',
	"top" text DEFAULT '0',
	"bottom" text DEFAULT '0',
	"pattern" text,
	"dlopattern" text
);
--> statement-breakpoint
CREATE TABLE "glassdescript" (
	"id" serial PRIMARY KEY NOT NULL,
	"glasstyp" text NOT NULL,
	"prefix" text,
	"description" text,
	"cutback" boolean DEFAULT false,
	"directional" boolean DEFAULT false,
	CONSTRAINT "glassdescript_glasstyp_unique" UNIQUE("glasstyp")
);
--> statement-breakpoint
CREATE TABLE "glassto" (
	"id" serial PRIMARY KEY NOT NULL,
	"dwgname" text NOT NULL,
	"handle" text NOT NULL,
	"elevation" text,
	"marknum" text NOT NULL,
	"floor" text,
	"qty" integer DEFAULT 1,
	"x_pt" text,
	"y_pt" text,
	"blx" text,
	"bly" text,
	"brx" text,
	"bry" text,
	"trx" text,
	"try_" text,
	"tlx" text,
	"tly" text,
	"location" text,
	"setback" text DEFAULT '0.75',
	UNIQUE ("dwgname", "handle")
);
