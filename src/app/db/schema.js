"use strict";
var __makeTemplateObject =
  (this && this.__makeTemplateObject) ||
  function (cooked, raw) {
    if (Object.defineProperty) {
      Object.defineProperty(cooked, "raw", { value: raw });
    } else {
      cooked.raw = raw;
    }
    return cooked;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.laborData =
  exports.attachments =
  exports.purchaseOrders =
  exports.vendors =
  exports.laborSnapshots =
  exports.equipment =
  exports.users =
  exports.manpower =
  exports.activities =
  exports.categories =
  exports.projects =
  exports.bankInfoTable =
  exports.customersTable =
  exports.invoicesTable =
    void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_orm_1 = require("drizzle-orm");
//👇🏻 invoice table with its column types
exports.invoicesTable = (0, pg_core_1.pgTable)("invoices", {
  id: (0, pg_core_1.serial)("id").primaryKey().notNull(),
  owner_id: (0, pg_core_1.text)("owner_id").notNull(),
  customer_id: (0, pg_core_1.text)("customer_id").notNull(),
  title: (0, pg_core_1.text)("title").notNull(),
  items: (0, pg_core_1.text)("items").notNull(),
  created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
  total_amount: (0, pg_core_1.numeric)("total_amount").notNull(),
});
//👇🏻 customers table with its column types
exports.customersTable = (0, pg_core_1.pgTable)("customers", {
  id: (0, pg_core_1.serial)("id").primaryKey().notNull(),
  created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
  owner_id: (0, pg_core_1.text)("owner_id").notNull(),
  name: (0, pg_core_1.text)("name").notNull(),
  email: (0, pg_core_1.text)("email").notNull(),
  address: (0, pg_core_1.text)("address").notNull(),
});
//👇🏻 bank_info table with its column types
exports.bankInfoTable = (0, pg_core_1.pgTable)("bank_info", {
  id: (0, pg_core_1.serial)("id").primaryKey().notNull(),
  owner_id: (0, pg_core_1.text)("owner_id").notNull().unique(),
  bank_name: (0, pg_core_1.text)("bank_name").notNull(),
  account_number: (0, pg_core_1.numeric)("account_number").notNull(),
  account_name: (0, pg_core_1.text)("account_name").notNull(),
  created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
  currency: (0, pg_core_1.text)("currency").notNull(),
});
exports.projects = (0, pg_core_1.pgTable)("projects", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  name: (0, pg_core_1.text)("name").notNull(),
  description: (0, pg_core_1.text)("description"), // New field for project description
  startDate: (0, pg_core_1.date)("start_date").notNull(),
  endDate: (0, pg_core_1.date)("end_date"),
  status: (0, pg_core_1.text)("status").notNull().default("active"), // New field for project status
  jobNumber: (0, pg_core_1.text)("job_number").unique(), //added field for job number
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.categories = (0, pg_core_1.pgTable)("categories", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  projectId: (0, pg_core_1.integer)("project_id")
    .notNull()
    .references(function () {
      return exports.projects.id;
    }), // Foreign key to projects
  name: (0, pg_core_1.text)("name").notNull(), // Name of the category
  sortOrder: (0, pg_core_1.integer)("sort_order").notNull(), // Field to control the order of categories
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.activities = (0, pg_core_1.pgTable)("activities", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  categoryId: (0, pg_core_1.integer)("category_id")
    .notNull()
    .references(function () {
      return exports.categories.id;
    }), // Foreign key to categories
  name: (0, pg_core_1.text)("name").notNull(),
  costCode: (0, pg_core_1.text)("cost_code").notNull(), // Field for cost code
  equipmentId: (0, pg_core_1.integer)("equipment_id").references(function () {
    return exports.equipment.id;
  }), // Foreign key to categories
  sortOrder: (0, pg_core_1.integer)("sort_order").notNull(),
  estimatedHours: (0, pg_core_1.integer)("estimated_hours"),
  notes: (0, pg_core_1.text)("notes"), // Field for additional notes
  completed: (0, pg_core_1.boolean)("completed").default(false).notNull(), // Field to track completion
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.manpower = (0, pg_core_1.pgTable)("manpower", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  activityId: (0, pg_core_1.integer)("activity_id")
    .notNull()
    .references(function () {
      return exports.activities.id;
    }),
  date: (0, pg_core_1.date)("date").notNull(), // Storing the actual date instead of offset
  manpower: (0, pg_core_1.integer)("manpower").notNull(),
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.users = (0, pg_core_1.pgTable)("users", {
  id: (0, pg_core_1.uuid)("id")
    .primaryKey()
    .default(
      (0, drizzle_orm_1.sql)(
        templateObject_1 ||
          (templateObject_1 = __makeTemplateObject(
            ["gen_random_uuid()"],
            ["gen_random_uuid()"]
          ))
      )
    ), // UUID primary key
  clerk_id: (0, pg_core_1.text)("clerk_id").notNull().unique(),
  email: (0, pg_core_1.text)("email").notNull().unique(),
  first_name: (0, pg_core_1.text)("first_name").notNull().default(""),
  last_name: (0, pg_core_1.text)("last_name").notNull().default(""),
  permission_level: (0, pg_core_1.text)("permission_level")
    .notNull()
    .default("read"),
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.equipment = (0, pg_core_1.pgTable)("equipment", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  projectId: (0, pg_core_1.integer)("project_id")
    .notNull()
    .references(function () {
      return exports.projects.id;
    }), // Assuming you have a projects table
  equipmentName: (0, pg_core_1.text)("equpipmentName").notNull(),
  sortOrder: (0, pg_core_1.integer)("sortOrder").notNull(),
  costPerDay: (0, pg_core_1.integer)("costPerDay").notNull(),
  costPerWeek: (0, pg_core_1.integer)("costPerWeek").notNull(),
  costPerMonth: (0, pg_core_1.integer)("costPerMonth").notNull(),
  deliveryFee: (0, pg_core_1.integer)("deliveryFee").notNull(),
  pickupFee: (0, pg_core_1.integer)("pickupFee").notNull(),
  notes: (0, pg_core_1.text)("notes"), // Field for additional notes
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.laborSnapshots = (0, pg_core_1.pgTable)("labor_snapshots", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  projectId: (0, pg_core_1.integer)("project_id")
    .notNull()
    .references(function () {
      return exports.projects.id;
    }),
  snapshotId: (0, pg_core_1.text)("snapshot_id").notNull(), // Storing as a string (e.g., ISO 8601)
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  snapshotData: (0, pg_core_1.text)("snapshot_data").notNull(), // Store the labor plan data as JSON
});
exports.vendors = (0, pg_core_1.pgTable)("vendors", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  vendorName: (0, pg_core_1.text)("vendor_name").notNull(),
  vendorAddress: (0, pg_core_1.text)("vendor_address").notNull(),
  vendorCity: (0, pg_core_1.text)("vendor_city").notNull(),
  vendorState: (0, pg_core_1.text)("vendor_state").notNull(),
  vendorZip: (0, pg_core_1.text)("vendor_zip").notNull(),
  vendorPhone: (0, pg_core_1.text)("vendor_phone"),
  vendorEmail: (0, pg_core_1.text)("vendor_email"),
  vendorContact: (0, pg_core_1.text)("vendor_contact"), // Contact person for the vendor
  internalVendorId: (0, pg_core_1.text)("internal_vendor_id"), // For linking to AP system
  taxable: (0, pg_core_1.boolean)("taxable").notNull().default(true), // Whether vendor is taxable
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
exports.purchaseOrders = (0, pg_core_1.pgTable)("purchase_orders", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  vendorId: (0, pg_core_1.integer)("vendor_id")
    .notNull()
    .references(function () {
      return exports.vendors.id;
    }), // Foreign key to the vendors table
  poNumber: (0, pg_core_1.text)("po_number").notNull(),
  jobNumber: (0, pg_core_1.text)("job_number").notNull(), // Job number or reference
  projectManager: (0, pg_core_1.text)("project_manager").notNull(),
  poDate: (0, pg_core_1.timestamp)("po_date").defaultNow().notNull(),
  dueDate: (0, pg_core_1.timestamp)("due_date"), // Date requested for the PO
  shipVia: (0, pg_core_1.text)("ship_via"), // Shipping method
  shipTo: (0, pg_core_1.text)("ship_to"), // Shipping address
  shipToAddress: (0, pg_core_1.text)("ship_to_address"),
  shipToCity: (0, pg_core_1.text)("ship_to_city"),
  shipToState: (0, pg_core_1.text)("ship_to_state"),
  shipToZip: (0, pg_core_1.text)("ship_to_zip"),
  costCode: (0, pg_core_1.text)("cost_code").notNull(), // Related cost code
  freight: (0, pg_core_1.numeric)("freight").notNull().default("0"), // Freight charges
  boxingCharges: (0, pg_core_1.numeric)("boxing_charges")
    .notNull()
    .default("0"), // Boxing charges
  poAmount: (0, pg_core_1.numeric)("po_amount").notNull(), // Total amount for the PO
  taxRate: (0, pg_core_1.decimal)("tax_rate", { precision: 5, scale: 2 }) // Decimal with precision 5 and scale 2
    .default("9.75") // Default value as a string
    .notNull(),
  taxable: (0, pg_core_1.boolean)("taxable").notNull().default(true), // Whether this PO is taxable
  warrantyYears: (0, pg_core_1.integer)("warranty_years"), // Warranty years
  shortDescription: (0, pg_core_1.text)("short_description").notNull(), // Brief summary for forms
  longDescription: (0, pg_core_1.text)("long_description"), // Detailed description of the order
  notes: (0, pg_core_1.text)("notes"), // For additional notes
  deliveryDate: (0, pg_core_1.timestamp)("delivery_date"), // Expected delivery date
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
});
// Defining the 'attachments' table schema
exports.attachments = (0, pg_core_1.pgTable)("attachments", {
  id: (0, pg_core_1.serial)("id").primaryKey(), // Auto-incrementing unique ID for each attachment
  tableName: (0, pg_core_1.text)("table_name").notNull(), // Table name the attachment is associated with
  recordId: (0, pg_core_1.integer)("record_id").notNull(), // ID of the record in the associated table
  fileName: (0, pg_core_1.text)("file_name").notNull(), // Original file name of the uploaded file
  fileUrl: (0, pg_core_1.text)("file_url").notNull(), // Dropbox URL where the file is stored
  fileSize: (0, pg_core_1.integer)("file_size").notNull(), // Size of the file in bytes
  notes: (0, pg_core_1.text)("notes").default(""), // Optional notes describing the attachment
  uploadedAt: (0, pg_core_1.timestamp)("uploaded_at").defaultNow(), // Timestamp when the file was uploaded
});
// Define the labor data schema
exports.laborData = (0, pg_core_1.pgTable)("labor_data", {
  id: (0, pg_core_1.serial)("id").primaryKey(),
  lastName: (0, pg_core_1.text)("last_name"),
  firstName: (0, pg_core_1.text)("first_name"),
  eid: (0, pg_core_1.integer)("eid"),
  day: (0, pg_core_1.text)("day"),
  date: (0, pg_core_1.text)("date"), // Stored as text for easier handling in JavaScript
  projectName: (0, pg_core_1.text)("project_name"),
  jobNumber: (0, pg_core_1.text)("job_number"), // Linking via job number field
  costCodeDivision: (0, pg_core_1.text)("cost_code_division"),
  costCodeNumber: (0, pg_core_1.text)("cost_code_number"),
  costCodeDescription: (0, pg_core_1.text)("cost_code_description"),
  classification: (0, pg_core_1.text)("classification"),
  shift: (0, pg_core_1.text)("shift"),
  payType: (0, pg_core_1.text)("pay_type"),
  hours: (0, pg_core_1.doublePrecision)("hours"), // Represents hours worked, allowing decimal values
  startTime: (0, pg_core_1.text)("start_time"), // Stored as text for reporting purposes
  endTime: (0, pg_core_1.text)("end_time"), // Stored as text for reporting purposes
  breaks: (0, pg_core_1.integer)("breaks"),
  mealBreaks: (0, pg_core_1.integer)("meal_breaks"),
  totalBreakTime: (0, pg_core_1.text)("total_break_time"), // Stored as text for reporting purposes
  workLogName: (0, pg_core_1.text)("work_log_name"),
  payrollNotes: (0, pg_core_1.text)("payroll_notes"),
  payrollAttachments: (0, pg_core_1.text)("payroll_attachments"),
  createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
  updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
var templateObject_1;
