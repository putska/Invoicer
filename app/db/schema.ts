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
  doublePrecision,
  PgJsonBuilder,
  varchar,
  bigint,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
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
  costCode: text("cost_code"), // Field for cost code
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
  jobId: integer("job_id")
    .notNull()
    .references(() => projects.id), // Foreign key to the projects table
  projectManager: text("project_manager").notNull(),
  poDate: timestamp("po_date").defaultNow().notNull(), // The date the PO was issued
  dueDate: timestamp("due_date"), // Date requested for the PO (when is the material due?)
  amount: text("amount"), // Total amount of the PO
  shipTo: text("ship_to"), // Shipping location (shop, job site, etc.)
  costCode: text("cost_code"), // Related cost code
  shortDescription: text("short_description").notNull(), // Brief summary for forms
  longDescription: text("long_description"), // Detailed description of the order
  notes: text("notes"), // For additional notes
  received: text("received"), // Information on what was received
  backorder: text("backorder"), // Information on what was backordered
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
  sharedLink: text("shared_link"), // Optional field for shared links
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
  hours: doublePrecision("hours"), // Represents hours worked, allowing decimal values
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

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit").default("piece"), // e.g., piece, roll, box
  photoUrl: text("photo_url").default(""), // URL for the material's photo
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id")
    .notNull()
    .references(() => materials.id), // Foreign key to the materials table
  requestedBy: uuid("requested_by")
    .notNull()
    .references(() => users.id), // Foreign key to the users table
  jobId: integer("job_id").notNull().default(0), // Job ID associated with the request
  quantity: integer("quantity").notNull(),
  status: text("status").notNull().default("requested"), // "requested", "delivered", or "canceled"
  comments: text("comments").default(""), // Notes or specifics about the request
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  service: varchar("service", { length: 50 }).notNull().unique(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"), // Optional but recommended
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
});

// Begin safety forms schema

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  formName: text("form_name").notNull(),
  pdfName: text("pdf_form").notNull(),
  jobName: text("job_name").notNull(),
  //jobId: integer("job_id").notNull().default(0), // Adding later
  userName: text("user_name").notNull(),
  dateCreated: text("date_created"), // Stored as text for easier handling in JavaScript
  submissionDate: timestamp("submission_date").defaultNow().notNull(),
  formData: jsonb("form_data").notNull(), // data for forms in jsonb format
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Begin Opti

export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  partNo: varchar("part_no", { length: 50 }).notNull(),
  length: decimal("length", { precision: 10, scale: 2 }).notNull(),
  markNo: varchar("mark_no", { length: 50 }),
  finish: varchar("finish", { length: 100 }),
  fab: varchar("fab", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockLengths = pgTable("stock_lengths", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  partNo: varchar("part_no", { length: 50 }).notNull(),
  finish: varchar("finish", { length: 100 }),
  length1: decimal("length1", { precision: 10, scale: 2 }).notNull(),
  length2: decimal("length2", { precision: 10, scale: 2 }),
  qty1: integer("qty1").notNull(),
  qty2: integer("qty2"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const optimizationJobs = pgTable("optimization_jobs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  bladeWidth: decimal("blade_width", { precision: 10, scale: 2 }).default(
    "0.25"
  ),
  resultsJson: text("results_json"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const cutPatterns = pgTable("cut_patterns", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => optimizationJobs.id),
  stockLength: decimal("stock_length", { precision: 10, scale: 2 }).notNull(),
  stockId: integer("stock_id").notNull(),
  remainingLength: decimal("remaining_length", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cuts = pgTable("cuts", {
  id: serial("id").primaryKey(),
  cutPatternId: integer("cut_pattern_id").references(() => cutPatterns.id),
  partNo: varchar("part_no", { length: 50 }).notNull(),
  length: decimal("length", { precision: 10, scale: 2 }).notNull(),
  markNo: varchar("mark_no", { length: 50 }),
  finish: varchar("finish", { length: 100 }),
  fab: varchar("fab", { length: 255 }),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// End Opti

// Begin Panel Optimization

// Table for stock sheet sizes
export const panelSheets = pgTable("panel_sheets", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id), // Reference to user
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  qty: integer("qty").notNull(),
  material: varchar("material", { length: 100 }),
  thickness: decimal("thickness", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table for panels to be cut
export const panels = pgTable("panels", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id), // Reference to user
  jobId: integer("job_id").references(() => panelJobs.id), // Reference to job
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  qty: integer("qty").notNull(),
  mark_no: varchar("mark_no", { length: 100 }),
  finish: varchar("finish", { length: 100 }),
  material: varchar("material", { length: 100 }),
  allowRotation: boolean("allow_rotation").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table for optimization jobs
export const panelJobs = pgTable("panel_jobs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id), // Reference to user
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  bladeWidth: decimal("blade_width", { precision: 10, scale: 2 }).default(
    "0.25"
  ),
  allowRotation: boolean("allow_rotation").default(true),
  resultsJson: text("results_json"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Table for panel placements on sheets
export const panelPlacements = pgTable("panel_placements", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => panelJobs.id), // Reference to job
  panelId: integer("panel_id").references(() => panels.id), // Reference to panel
  sheetId: integer("sheet_id").references(() => panelSheets.id), // Reference to sheet
  sheetNo: integer("sheet_no").notNull(),
  x: decimal("x", { precision: 10, scale: 2 }).notNull(),
  y: decimal("y", { precision: 10, scale: 2 }).notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  rotated: boolean("rotated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table for used sheets in cutting patterns
export const usedSheets = pgTable("used_sheets", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => panelJobs.id), // Reference to job
  sheetId: integer("sheet_id").references(() => panelSheets.id), // Reference to sheet
  sheetNo: integer("sheet_no").notNull(),
  usedArea: decimal("used_area", { precision: 10, scale: 2 }).notNull(),
  wastePercentage: decimal("waste_percentage", {
    precision: 10,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Glass Takeoff tables

export const glass = pgTable("glass", {
  id: serial("id").primaryKey(),
  markNum: text("marknum").notNull(),
  markIndex: text("markindex").notNull(),
  gtype: text("gtype").notNull(),
  width: text("width").notNull(), // Changed from real to text
  height: text("height").notNull(), // Changed from real to text
  height2: text("height2").notNull().default("0"), // Changed from real to text
  dloWidth: text("dlowidth").notNull(), // Changed from real to text
  dloHeight: text("dloheight").notNull(), // Changed from real to text
  dloHeight2: text("dloheight2").notNull().default("0"), // Changed from real to text
  left: text("left").default("0"), // Changed from real to text
  right: text("right").default("0"), // Changed from real to text
  top: text("top").default("0"), // Changed from real to text
  bottom: text("bottom").default("0"), // Changed from real to text
  pattern: text("pattern"),
  dlopattern: text("dlopattern"),
});

export const glassDescript = pgTable("glassdescript", {
  id: serial("id").primaryKey(),
  glasstyp: text("glasstyp").notNull().unique(),
  prefix: text("prefix"),
  description: text("description"),
  cutback: boolean("cutback").default(false),
  directional: boolean("directional").default(false),
});

export const glassTO = pgTable(
  "glassto",
  {
    id: serial("id").primaryKey(),
    dwgname: text("dwgname").notNull(),
    handle: text("handle").notNull(),
    elevation: text("elevation"),
    markNum: text("marknum").notNull(),
    floor: text("floor"),
    qty: integer("qty").default(1),
    x_pt: text("x_pt"),
    y_pt: text("y_pt"),
    blx: text("blx"),
    bly: text("bly"),
    brx: text("brx"),
    bry: text("bry"),
    trx: text("trx"),
    try_: text("try_"),
    tlx: text("tlx"),
    tly: text("tly"),
    location: text("location"),
    setback: text("setback").default("0.75"),
  },
  (table) => [
    // Return an array instead of an object - this is the new syntax
    uniqueIndex("dwg_handle_idx").on(table.dwgname, table.handle),
  ]
);

// Engineering schedule tables

// Engineers table
export const engineers = pgTable("engineers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  active: boolean("active").notNull().default(true),
  order: integer("order").notNull().default(0), // For sorting engineers in UI
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Engineering tasks table
export const engineeringTasks = pgTable("engineering_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  notes: text("notes"),
  durationDays: integer("duration_days").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("unassigned"), // unassigned, assigned, in_progress, completed, blocked, archived
  isLastMinute: boolean("is_last_minute").notNull().default(false),
  createdBy: text("created_by").notNull(), // Clerk user ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task assignments table
export const taskAssignments = pgTable("task_assignments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => engineeringTasks.id, { onDelete: "cascade" }),
  engineerId: integer("engineer_id")
    .notNull()
    .references(() => engineers.id, { onDelete: "cascade" }),
  position: integer("position").notNull(), // Order in the engineer's queue
  scheduledStart: date("scheduled_start"),
  scheduledEnd: date("scheduled_end"),
  actualStart: date("actual_start"),
  actualEnd: date("actual_end"),
  assignedBy: text("assigned_by").notNull(), // Clerk user ID
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Task history for audit trail
export const taskHistory = pgTable("task_history", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => engineeringTasks.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // created, updated, assigned, unassigned, status_changed, moved
  details: jsonb("details"), // Store old/new values, positions, etc.
  performedBy: text("performed_by").notNull(), // Clerk user ID
  performedAt: timestamp("performed_at").defaultNow().notNull(),
});

// Checklist table: one per checklist, linked to a task
export const engineeringTaskChecklists = pgTable(
  "engineering_task_checklists",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => engineeringTasks.id),
    name: varchar("name", { length: 128 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  }
);

// Checklist item table: one per item, linked to a checklist
export const engineeringTaskChecklistItems = pgTable(
  "engineering_task_checklist_items",
  {
    id: serial("id").primaryKey(),
    checklistId: integer("checklist_id")
      .notNull()
      .references(() => engineeringTaskChecklists.id),
    text: varchar("text", { length: 256 }).notNull(),
    checked: boolean("checked").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  }
);

// TypeScript types for the tables
export type Engineer = typeof engineers.$inferSelect;
export type NewEngineer = typeof engineers.$inferInsert;
export type EngineeringTask = typeof engineeringTasks.$inferSelect;
export type NewEngineeringTask = typeof engineeringTasks.$inferInsert;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type NewTaskAssignment = typeof taskAssignments.$inferInsert;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type NewTaskHistory = typeof taskHistory.$inferInsert;
