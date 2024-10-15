import {
  text,
  serial,
  pgTable,
  timestamp,
  date,
  uuid,
  integer,
  numeric,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

//👇🏻 invoice table with its column types
export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey().notNull(),
  owner_id: text("owner_id").notNull(),
  customer_id: text("customer_id").notNull(),
  title: text("title").notNull(),
  items: text("items").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  total_amount: numeric("total_amount").notNull(),
});

//👇🏻 customers table with its column types
export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey().notNull(),
  created_at: timestamp("created_at").defaultNow(),
  owner_id: text("owner_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
});

//👇🏻 bank_info table with its column types
export const bankInfoTable = pgTable("bank_info", {
  id: serial("id").primaryKey().notNull(),
  owner_id: text("owner_id").notNull().unique(),
  bank_name: text("bank_name").notNull(),
  account_number: numeric("account_number").notNull(),
  account_name: text("account_name").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  currency: text("currency").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"), // New field for project description
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"), // New field for project status
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id), // Foreign key to projects
  name: text("name").notNull(), // Name of the category
  sortOrder: integer("sort_order").notNull(), // Field to control the order of categories
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id), // Foreign key to categories
  name: text("name").notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id), // Foreign key to categories
  sortOrder: integer("sort_order").notNull(),
  estimatedHours: integer("estimated_hours"),
  notes: text("notes"), // Field for additional notes
  completed: boolean("completed").default(false).notNull(), // Field to track completion
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const manpower = pgTable("manpower", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activities.id),
  date: date("date").notNull(), // Storing the actual date instead of offset
  manpower: integer("manpower").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`), // UUID primary key
  clerk_id: text("clerk_id").notNull().unique(),
  email: text("email").notNull().unique(),
  first_name: text("first_name").notNull().default(""),
  last_name: text("last_name").notNull().default(""),
  permission_level: text("permission_level").notNull().default("read"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id), // Assuming you have a projects table
  equipmentName: text("equpipmentName").notNull(),
  sortOrder: integer("sortOrder").notNull(),
  costPerDay: integer("costPerDay").notNull(),
  costPerWeek: integer("costPerWeek").notNull(),
  costPerMonth: integer("costPerMonth").notNull(),
  deliveryFee: integer("deliveryFee").notNull(),
  pickupFee: integer("pickupFee").notNull(),
  notes: text("notes"), // Field for additional notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const laborSnapshots = pgTable("labor_snapshots", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id),
  snapshotId: text("snapshot_id").notNull(), // Storing as a string (e.g., ISO 8601)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  snapshotData: text("snapshot_data").notNull(), // Store the labor plan data as JSON
});
