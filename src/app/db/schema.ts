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
  decimal,
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
  jobNumber: text("job_number").unique(), //added field for job number
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

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  vendorName: text("vendor_name").notNull(),
  vendorAddress: text("vendor_address").notNull(),
  vendorCity: text("vendor_city").notNull(),
  vendorState: text("vendor_state").notNull(),
  vendorZip: text("vendor_zip").notNull(),
  vendorPhone: text("vendor_phone"),
  vendorEmail: text("vendor_email"),
  vendorContact: text("vendor_contact"), // Contact person for the vendor
  internalVendorId: text("internal_vendor_id"), // For linking to AP system
  taxable: boolean("taxable").notNull().default(true), // Whether vendor is taxable
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id")
    .notNull()
    .references(() => vendors.id), // Foreign key to the vendors table
  poNumber: text("po_number").notNull(),
  jobNumber: text("job_number").notNull(), // Job number or reference
  projectManager: text("project_manager").notNull(),
  poDate: timestamp("po_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"), // Date requested for the PO
  shipVia: text("ship_via"), // Shipping method
  shipTo: text("ship_to"), // Shipping address
  shipToAddress: text("ship_to_address"),
  shipToCity: text("ship_to_city"),
  shipToState: text("ship_to_state"),
  shipToZip: text("ship_to_zip"),
  costCode: text("cost_code").notNull(), // Related cost code
  freight: numeric("freight").notNull().default("0"), // Freight charges
  boxingCharges: numeric("boxing_charges").notNull().default("0"), // Boxing charges
  poAmount: numeric("po_amount").notNull(), // Total amount for the PO
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }) // Decimal with precision 5 and scale 2
    .default("9.75") // Default value as a string
    .notNull(),
  taxable: boolean("taxable").notNull().default(true), // Whether this PO is taxable
  warrantyYears: integer("warranty_years"), // Warranty years
  shortDescription: text("short_description").notNull(), // Brief summary for forms
  longDescription: text("long_description"), // Detailed description of the order
  notes: text("notes"), // For additional notes
  deliveryDate: timestamp("delivery_date"), // Expected delivery date
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Defining the 'attachments' table schema
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(), // Auto-incrementing unique ID for each attachment
  tableName: text("table_name").notNull(), // Table name the attachment is associated with
  recordId: integer("record_id").notNull(), // ID of the record in the associated table
  fileName: text("file_name").notNull(), // Original file name of the uploaded file
  fileUrl: text("file_url").notNull(), // Dropbox URL where the file is stored
  fileSize: integer("file_size").notNull(), // Size of the file in bytes
  notes: text("notes").default(""), // Optional notes describing the attachment
  uploadedAt: timestamp("uploaded_at").defaultNow(), // Timestamp when the file was uploaded
});

// Define the labor data schema
export const laborData = pgTable("labor_data", {
  id: serial("id").primaryKey(),
  lastName: text("last_name"),
  firstName: text("first_name"),
  eid: integer("eid"),
  day: text("day"),
  date: text("date"), // Stored as text for easier handling in JavaScript
  projectName: text("project_name"),
  jobNumber: text("job_number"), // Linking via job number field
  costCodeDivision: text("cost_code_division"),
  costCodeNumber: text("cost_code_number"),
  costCodeDescription: text("cost_code_description"),
  classification: text("classification"),
  shift: text("shift"),
  payType: text("pay_type"),
  hours: numeric("hours"), // Represents hours worked, allowing decimal values
  startTime: text("start_time"), // Stored as text for reporting purposes
  endTime: text("end_time"), // Stored as text for reporting purposes
  breaks: integer("breaks"),
  mealBreaks: integer("meal_breaks"),
  totalBreakTime: text("total_break_time"), // Stored as text for reporting purposes
  workLogName: text("work_log_name"),
  payrollNotes: text("payroll_notes"),
  payrollAttachments: text("payroll_attachments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
