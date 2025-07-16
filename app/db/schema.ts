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
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

import { sql, relations } from "drizzle-orm";

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
    .references(() => categories.id, { onDelete: "cascade" }), // Foreign key to categories
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
    .references(() => activities.id, { onDelete: "cascade" }),
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

// Engineering notes tables

// Database Schema for Engineering Notes

// Existing note categories table (unchanged)
export const noteCategories = pgTable("note_categories", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// UPDATED: Engineering notes table - removed statusId field
export const engineeringNotes = pgTable("engineering_notes", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => noteCategories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"), // Rich text content
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Existing note statuses table (unchanged)
export const noteStatuses = pgTable("note_statuses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  bgColor: text("bg_color").notNull(),
  borderColor: text("border_color").notNull(),
  textColor: text("text_color").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// NEW: Junction table for many-to-many note-status relationships
export const noteStatusAssignments = pgTable(
  "note_status_assignments",
  {
    id: serial("id").primaryKey(),
    noteId: integer("note_id")
      .notNull()
      .references(() => engineeringNotes.id, { onDelete: "cascade" }),
    statusId: integer("status_id")
      .notNull()
      .references(() => noteStatuses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint to prevent duplicate note-status assignments
    uniqueNoteStatus: unique().on(table.noteId, table.statusId),
  })
);

// Existing checklist tables (unchanged)
export const noteChecklists = pgTable("note_checklists", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id")
    .notNull()
    .references(() => engineeringNotes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const noteChecklistItems = pgTable("note_checklist_items", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id")
    .notNull()
    .references(() => noteChecklists.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  checked: boolean("checked").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Begin BIM Models and Elements Schemas

// Define types for our JSON fields
export type ElementProperties = Record<
  string,
  string | number | boolean | null
>;
export type GeometryData = {
  vertices?: number;
  faces?: number;
  type?: string;
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  [key: string]: any; // Allow additional properties
};
export type ModelMetadata = {
  totalElements?: number;
  elementTypes?: Record<string, number>;
  levels?: string[];
  materials?: string[];
  ifcSchema?: string;
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  [key: string]: any; // Allow additional properties
};

// BIM Models table
export const bimModels = pgTable(
  "bim_models",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    filePath: varchar("file_path", { length: 500 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }),
    mimeType: varchar("mime_type", { length: 100 }),
    uploadDate: timestamp("upload_date").defaultNow(),
    uploadedBy: integer("uploaded_by"),
    version: varchar("version", { length: 50 }),
    revitVersion: varchar("revit_version", { length: 50 }),
    ifcSchema: varchar("ifc_schema", { length: 50 }),
    projectId: integer("project_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    createdBy: integer("created_by"),
    isActive: boolean("is_active").default(true),
    metadata: jsonb("metadata").$type<ModelMetadata>(),
  },
  (table) => [
    index("idx_bim_models_project").on(table.projectId),
    index("idx_bim_models_active").on(table.isActive),
    index("idx_bim_models_upload_date").on(table.uploadDate),
  ]
);

// BIM Elements table
export const bimElements = pgTable(
  "bim_elements",
  {
    id: serial("id").primaryKey(),
    modelId: integer("model_id")
      .notNull()
      .references(() => bimModels.id, { onDelete: "cascade" }),
    ifcId: varchar("ifc_id", { length: 255 }).notNull(),
    elementType: varchar("element_type", { length: 100 }),
    elementName: varchar("element_name", { length: 255 }),
    level: varchar("level", { length: 100 }),
    material: varchar("material", { length: 255 }),
    properties: jsonb("properties").$type<ElementProperties>(),
    geometryData: jsonb("geometry_data").$type<GeometryData>(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_bim_elements_model_id").on(table.modelId),
    index("idx_bim_elements_ifc_id").on(table.ifcId),
    index("idx_bim_elements_type").on(table.elementType),
    // Unique constraint on modelId + ifcId combination
    uniqueIndex("unique_model_ifc").on(table.modelId, table.ifcId),
  ]
);

// Relations
export const bimModelsRelations = relations(bimModels, ({ many }) => ({
  elements: many(bimElements),
}));

export const bimElementsRelations = relations(bimElements, ({ one }) => ({
  model: one(bimModels, {
    fields: [bimElements.modelId],
    references: [bimModels.id],
  }),
}));

// Types inferred from schema
export type BIMModel = typeof bimModels.$inferSelect;
export type NewBIMModel = typeof bimModels.$inferInsert;
export type BIMElement = typeof bimElements.$inferSelect;
export type NewBIMElement = typeof bimElements.$inferInsert;

// ***************** Holiday Management Schema *****************
// Define the holiday type enum
export const holidayTypeEnum = pgEnum("holiday_type", [
  "field",
  "office",
  "both",
]);

// Define the holidays table
export const holidays = pgTable(
  "holidays",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: holidayTypeEnum("type").notNull(),
    isRecurring: boolean("is_recurring").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Unique index to prevent duplicate holidays on the same date with same type
    uniqueIndex("idx_holidays_date_type").on(table.date, table.type),
    // Index for efficient date range queries
    index("idx_holidays_date").on(table.date),
    // Index for type filtering
    index("idx_holidays_type").on(table.type),
  ]
);

// Type inference for TypeScript
export type HolidaySchema = typeof holidays.$inferSelect;
export type NewHolidaySchema = typeof holidays.$inferInsert;

// +++++++++++++++++++++++ Begin Estimating Schema +++++++++++++++++++++++

// Estimates - TOP LEVEL table for jobs we're bidding on (separate from awarded projects)
export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  estimateNumber: varchar("estimate_number", { length: 50 }).notNull().unique(), // "EST-2024-001", "PROJ-ABC", etc.
  name: varchar("name", { length: 255 }).notNull(), // "Downtown Office Building", "Medical Center Phase 2", etc.
  description: text("description"),

  // Project details
  buildingType: varchar("building_type", { length: 100 }), // "Office", "Retail", "Healthcare", etc.
  location: varchar("location", { length: 255 }), // Project location
  architect: varchar("architect", { length: 255 }), // Architect firm
  contractor: varchar("contractor", { length: 255 }), // General contractor
  owner: varchar("owner", { length: 255 }), // Building owner/developer

  // Important dates
  bidDate: timestamp("bid_date"), // When bid is due
  projectStartDate: timestamp("project_start_date"), // Anticipated project start
  projectEndDate: timestamp("project_end_date"), // Anticipated project completion

  // Project scope
  totalSquareFootage: decimal("total_square_footage", {
    precision: 12,
    scale: 2,
  }), // Building sq ft
  storiesBelowGrade: integer("stories_below_grade").default(0),
  storiesAboveGrade: integer("stories_above_grade").default(1),

  // Estimate status tracking
  status: varchar("status", { length: 50 }).notNull().default("active"),
  // 'active', 'on_hold', 'bid_submitted', 'awarded', 'lost', 'cancelled', 'no_bid'

  // Opportunity tracking
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }), // Client's estimated project value
  confidenceLevel: varchar("confidence_level", { length: 20 }), // 'high', 'medium', 'low'
  competitionLevel: varchar("competition_level", { length: 20 }), // 'high', 'medium', 'low'
  relationshipStatus: varchar("relationship_status", { length: 50 }), // 'existing_client', 'new_client', 'referral'

  // Contact information
  primaryContact: varchar("primary_contact", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 50 }),

  // Internal tracking
  assignedEstimator: varchar("assigned_estimator", { length: 255 }),
  salesPerson: varchar("sales_person", { length: 255 }),

  notes: text("notes"),
  internalNotes: text("internal_notes"), // Internal notes not for client
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bids - our actual bid submissions for an estimate (one-to-many relationship)
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id")
    .notNull()
    .references(() => estimates.id, { onDelete: "cascade" }),
  bidNumber: varchar("bid_number", { length: 50 }).notNull(), // "BID-001", "REV-A", etc.
  name: varchar("name", { length: 255 }).notNull(), // "Initial Budget", "Hard Budget", "Firm Estimate", etc.
  description: text("description"),

  // Bid progression stages
  stage: varchar("stage", { length: 50 }).notNull().default("initial_budget"),
  // 'initial_budget' -> 'hard_budget' -> 'initial_pricing' -> 'firm_estimate' -> 'final_bid' -> 'submitted'
  version: integer("version").notNull().default(1), // Version tracking within same stage
  parentBidId: integer("parent_bid_id"), // Links to previous version/stage - FK will be added in migration

  // Bid metadata
  preparedBy: varchar("prepared_by", { length: 255 }), // User who prepared bid
  reviewedBy: varchar("reviewed_by", { length: 255 }), // User who reviewed bid
  approvedBy: varchar("approved_by", { length: 255 }), // User who approved bid
  submittedDate: timestamp("submitted_date"), // When bid was submitted

  // Pricing breakdown
  totalMaterialCost: decimal("total_material_cost", {
    precision: 12,
    scale: 2,
  }).default("0.00"),
  totalLaborCost: decimal("total_labor_cost", {
    precision: 12,
    scale: 2,
  }).default("0.00"),
  totalSubcontractorCost: decimal("total_subcontractor_cost", {
    precision: 12,
    scale: 2,
  }).default("0.00"),
  totalEquipmentCost: decimal("total_equipment_cost", {
    precision: 12,
    scale: 2,
  }).default("0.00"),
  totalOverheadCost: decimal("total_overhead_cost", {
    precision: 12,
    scale: 2,
  }).default("0.00"),
  totalProfitAmount: decimal("total_profit_amount", {
    precision: 12,
    scale: 2,
  }).default("0.00"),
  totalBidAmount: decimal("total_bid_amount", {
    precision: 12,
    scale: 2,
  }).default("0.00"),

  // Bid parameters
  overheadPercentage: decimal("overhead_percentage", {
    precision: 5,
    scale: 2,
  }).default("10.00"), // % of costs
  profitPercentage: decimal("profit_percentage", {
    precision: 5,
    scale: 2,
  }).default("8.00"), // % of costs + overhead
  contingencyPercentage: decimal("contingency_percentage", {
    precision: 5,
    scale: 2,
  }).default("5.00"), // % contingency

  // Schedule and delivery
  proposedStartDate: timestamp("proposed_start_date"),
  proposedCompletionDate: timestamp("proposed_completion_date"),
  deliveryWeeks: integer("delivery_weeks"), // Lead time in weeks

  // Competitive info
  alternateRequested: boolean("alternate_requested").default(false),
  alternateDescription: text("alternate_description"),
  valueEngineeringNotes: text("value_engineering_notes"),
  exclusions: text("exclusions"), // What's excluded from bid
  assumptions: text("assumptions"), // Bid assumptions

  // Bid status
  isActive: boolean("is_active").default(true), // Current working bid vs archived
  isSubmitted: boolean("is_submitted").default(false),

  notes: text("notes"),
  internalNotes: text("internal_notes"), // Notes not visible to client
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Elevations - represents a single elevation view within a bid
export const elevations = pgTable("elevations", {
  id: serial("id").primaryKey(),
  bidId: integer("bid_id")
    .notNull()
    .references(() => bids.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(), // "North Elevation", "Storefront A", etc.
  description: text("description"),
  elevationType: varchar("elevation_type", { length: 50 })
    .notNull()
    .default("storefront"),
  // 'storefront', 'curtain_wall', 'window_wall', 'entrance', 'canopy', 'mixed'

  // Physical dimensions
  totalWidth: decimal("total_width", { precision: 10, scale: 2 }).notNull(), // in feet
  totalHeight: decimal("total_height", { precision: 10, scale: 2 }).notNull(), // in feet
  floorHeight: decimal("floor_height", { precision: 10, scale: 2 }).notNull(), // height from floor to bottom of glazing
  floorNumber: integer("floor_number").default(1), // Which floor this elevation is on

  // Drawing references
  drawingNumber: varchar("drawing_number", { length: 50 }), // Reference to architectural drawing
  drawingRevision: varchar("drawing_revision", { length: 10 }), // Drawing revision
  gridLine: varchar("grid_line", { length: 50 }), // Building grid line reference
  detailReference: varchar("detail_reference", { length: 50 }), // Detail drawing reference

  // Elevation-specific costs (rolled up from openings)
  materialCost: decimal("material_cost", { precision: 10, scale: 2 }).default(
    "0.00"
  ),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }).default("0.00"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default("0.00"),

  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Openings - individual glazing openings within an elevation
export const openings = pgTable("openings", {
  id: serial("id").primaryKey(),
  elevationId: integer("elevation_id")
    .notNull()
    .references(() => elevations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(), // "Opening 1", "Main Entry", etc.
  openingMark: varchar("opening_mark", { length: 50 }), // "A1", "B2", etc. from drawings

  // Geometry
  startPosition: decimal("start_position", {
    precision: 10,
    scale: 2,
  }).notNull(), // distance from left edge of elevation
  width: decimal("width", { precision: 10, scale: 2 }).notNull(), // width of opening
  height: decimal("height", { precision: 10, scale: 2 }).notNull(), // height of opening
  sillHeight: decimal("sill_height", { precision: 10, scale: 2 }).notNull(), // height from floor to bottom of opening

  // Opening type and features
  openingType: varchar("opening_type", { length: 50 }).notNull(),
  // 'storefront', 'curtain_wall', 'window', 'entrance_door', 'fixed_window', 'operable_window'
  glazingSystem: varchar("glazing_system", { length: 100 }), // "Kawneer 1600", "YKK AP", etc.
  hasTransom: boolean("has_transom").default(false),
  transomHeight: decimal("transom_height", { precision: 10, scale: 2 }), // height of transom if present

  // Grid Definition Fields
  gridColumns: integer("grid_columns").default(1), // Number of columns in the grid
  gridRows: integer("grid_rows").default(1), // Number of rows in the grid
  mullionWidth: decimal("mullion_width", { precision: 10, scale: 2 }).default(
    "2.50"
  ), // Mullion width in inches
  spacingVertical: varchar("spacing_vertical", { length: 20 }).default("equal"), // 'equal' or 'custom'
  spacingHorizontal: varchar("spacing_horizontal", { length: 20 }).default(
    "equal"
  ), // 'equal' or 'custom'

  // Component naming for mapping to manufacturer catalogs
  componentSill: varchar("component_sill", { length: 100 }).default("Sill"), // Sill component name
  componentHead: varchar("component_head", { length: 100 }).default("Head"), // Head component name
  componentJambs: varchar("component_jambs", { length: 100 }).default("Jamb"), // Jamb component name
  componentVerticals: varchar("component_verticals", { length: 100 }).default(
    "Vertical"
  ), // Vertical mullion component name
  componentHorizontals: varchar("component_horizontals", {
    length: 100,
  }).default("Horizontal"), // Horizontal mullion component name

  // Performance requirements
  thermalPerformance: varchar("thermal_performance", { length: 50 }), // U-factor requirements
  windLoadRequirement: varchar("wind_load_requirement", { length: 50 }), // Wind load psf
  seismicRequirement: varchar("seismic_requirement", { length: 50 }), // Seismic zone requirements
  acousticRequirement: varchar("acoustic_requirement", { length: 50 }), // STC rating requirements

  // Quantity and cost tracking
  quantity: integer("quantity").default(1), // Number of identical openings
  unitMaterialCost: decimal("unit_material_cost", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  unitLaborCost: decimal("unit_labor_cost", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  totalMaterialCost: decimal("total_material_cost", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  totalLaborCost: decimal("total_labor_cost", {
    precision: 10,
    scale: 2,
  }).default("0.00"),

  // Additional fields
  description: text("description"), // Renamed from notes for clarity
  notes: text("notes"), // Keep for backward compatibility
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grid Mullions - individual mullion elements within an opening
export const gridMullions = pgTable("grid_mullions", {
  id: serial("id").primaryKey(),
  openingId: integer("opening_id")
    .notNull()
    .references(() => openings.id, { onDelete: "cascade" }),

  // Mullion identification
  gridType: varchar("grid_type", { length: 20 }).notNull(),
  // 'vertical', 'horizontal', 'sill', 'head', 'jamb_left', 'jamb_right'
  gridColumn: integer("grid_column"), // Column index for vertical mullions
  gridRow: integer("grid_row"), // Row index for horizontal mullions

  // Physical properties
  length: decimal("length", { precision: 10, scale: 2 }).notNull(), // Length in feet
  componentName: varchar("component_name", { length: 100 }).notNull(), // "Vertical Mullion", "Sill", etc.

  // Position and customization
  defaultPosition: decimal("default_position", { precision: 10, scale: 2 }), // Grid-calculated position
  customPosition: decimal("custom_position", { precision: 10, scale: 2 }), // User-modified position
  isActive: boolean("is_active").default(true), // Can be toggled on/off

  // Added when we ran horizontals in between the verticals
  gridSegment: integer("grid_segment"),
  startX: decimal("start_x", { precision: 10, scale: 2 }),
  endX: decimal("end_x", { precision: 10, scale: 2 }),

  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grid Glass Panels - individual glass panel elements within an opening
export const gridGlassPanels = pgTable("grid_glass_panels", {
  id: serial("id").primaryKey(),
  openingId: integer("opening_id")
    .notNull()
    .references(() => openings.id, { onDelete: "cascade" }),

  // Grid position
  gridColumn: integer("grid_column").notNull(), // 0-based column index
  gridRow: integer("grid_row").notNull(), // 0-based row index

  // Physical dimensions and position
  x: decimal("x", { precision: 10, scale: 2 }).notNull(), // X position from left edge
  y: decimal("y", { precision: 10, scale: 2 }).notNull(), // Y position from bottom edge
  width: decimal("width", { precision: 10, scale: 2 }).notNull(), // Panel width
  height: decimal("height", { precision: 10, scale: 2 }).notNull(), // Panel height

  // Panel properties
  isTransom: boolean("is_transom").default(false), // Is this a transom panel
  glassType: varchar("glass_type", { length: 100 }).default("Standard"), // Glass specification
  isActive: boolean("is_active").default(true), // Can be disabled

  // Cost tracking
  area: decimal("area", { precision: 10, scale: 2 }), // Calculated area
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).default("0.00"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default("0.00"),

  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grid Configurations - store different grid layouts for the same opening
export const gridConfigurations = pgTable("grid_configurations", {
  id: serial("id").primaryKey(),
  openingId: integer("opening_id")
    .notNull()
    .references(() => openings.id, { onDelete: "cascade" }),

  // Configuration metadata
  name: varchar("name", { length: 255 }).notNull(), // "Option A", "Client Preference", etc.
  description: text("description"),
  isActive: boolean("is_active").default(false), // Only one can be active per opening

  // Grid parameters (snapshot when configuration was created)
  columns: integer("columns").notNull(),
  rows: integer("rows").notNull(),
  mullionWidth: decimal("mullion_width", { precision: 10, scale: 2 }).notNull(),

  // Cost summary
  totalMullionLength: decimal("total_mullion_length", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  totalGlassArea: decimal("total_glass_area", {
    precision: 10,
    scale: 2,
  }).default("0.00"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }).default(
    "0.00"
  ),

  // Metadata
  createdBy: varchar("created_by", { length: 100 }), // User who created this configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mullions - vertical and horizontal divisions within openings
export const mullions = pgTable("mullions", {
  id: serial("id").primaryKey(),
  openingId: integer("opening_id")
    .notNull()
    .references(() => openings.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'vertical', 'horizontal'
  position: decimal("position", { precision: 10, scale: 2 }).notNull(), // distance from left edge (vertical) or bottom (horizontal)
  mullionType: varchar("mullion_type", { length: 50 }).notNull(), // 'intermediate', 'structural', 'expansion', 'thermal_break'
  depth: decimal("depth", { precision: 10, scale: 2 }).default("2.00"), // depth of mullion in inches
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Glass Panels - individual glass panels created by the mullion divisions
export const glassPanels = pgTable("glass_panels", {
  id: serial("id").primaryKey(),
  openingId: integer("opening_id")
    .notNull()
    .references(() => openings.id, { onDelete: "cascade" }),
  panelNumber: integer("panel_number").notNull(), // sequential numbering within the opening
  x: decimal("x", { precision: 10, scale: 2 }).notNull(), // x position from left edge of opening
  y: decimal("y", { precision: 10, scale: 2 }).notNull(), // y position from bottom of opening
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }).notNull(), // calculated area in sq ft
  isTransom: boolean("is_transom").default(false),
  isOperable: boolean("is_operable").default(false), // Can the panel open?
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Doors - specific door locations within openings
export const doors = pgTable("doors", {
  id: serial("id").primaryKey(),
  openingId: integer("opening_id")
    .notNull()
    .references(() => openings.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(), // "Main Entry", "Exit Door", etc.
  doorMark: varchar("door_mark", { length: 50 }), // Door mark from drawings
  position: decimal("position", { precision: 10, scale: 2 }).notNull(), // distance from left edge of opening
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  doorType: varchar("door_type", { length: 50 }).notNull(), // 'single', 'double', 'slider', 'revolving', 'automatic'
  handingType: varchar("handing_type", { length: 20 }), // 'left', 'right', 'center'
  hasVision: boolean("has_vision").default(true), // whether door has glass vision panel
  doorMaterial: varchar("door_material", { length: 50 }), // 'aluminum', 'steel', 'glass'

  // Hardware and accessories
  lockType: varchar("lock_type", { length: 50 }), // 'keyed', 'panic', 'card_reader', 'keypad'
  closerType: varchar("closer_type", { length: 50 }), // 'surface', 'concealed', 'floor_spring'
  hasAutomaticOperator: boolean("has_automatic_operator").default(false),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Special Conditions - corners, returns, angles, etc.
export const specialConditions = pgTable("special_conditions", {
  id: serial("id").primaryKey(),
  elevationId: integer("elevation_id")
    .notNull()
    .references(() => elevations.id, { onDelete: "cascade" }),
  conditionType: varchar("condition_type", { length: 50 }).notNull(),
  // 'corner', 'return', 'angle', 'step_down', 'canopy', 'soffit', 'column_cover'
  position: decimal("position", { precision: 10, scale: 2 }).notNull(), // position along elevation
  width: decimal("width", { precision: 10, scale: 2 }), // width if applicable
  height: decimal("height", { precision: 10, scale: 2 }), // height if applicable
  angle: decimal("angle", { precision: 5, scale: 2 }), // angle in degrees if applicable
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
