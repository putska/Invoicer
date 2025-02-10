interface Item {
  id: string;
  name: string;
  cost: number;
  quantity: number;
  price: number;
}

interface Invoice {
  id?: string;
  created_at?: string;
  user_id: string;
  customer_id: number;
  title: string;
  items: string;
  total_amount: number;
}

interface Customer {
  user_id: string;
  name: string;
  email: string;
  address: string;
}

interface BankInfo {
  user_id: string;
  account_name: string;
  account_number: number;
  bank_name: string;
  currency: string;
}

export interface Project {
  id?: number;
  name: string;
  jobNumber: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  id?: number;
  projectId: number;
  name: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  activities?: Activity[];
}

export interface Activity {
  id?: number;
  categoryId: string; // Reference to the Category ID
  costCode: string;
  name: string;
  equipmentId?: string; // Since it's a one-to-one relationship
  sortOrder?: number;
  estimatedHours?: number;
  notes?: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface APICategory {
  categoryId?: number;
  projectId: string;
  categoryName: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  activities?: Activity[];
}

// types.ts

export interface CategorySortOrderUpdate {
  categoryId: number;
  sortOrder: number;
}

export interface ActivitySortOrderUpdate {
  activityId: number;
  sortOrder: number;
  categoryId?: number; // Optional, only when moving activities between categories
}

export interface UpdateSortOrderRequest {
  categories: CategorySortOrderUpdate[];
  activities: ActivitySortOrderUpdate[];
}

export interface UpdateSortOrderResponse {
  message: string;
}

export interface APIActivity {
  activityId?: number;
  categoryId: string; // Reference to the Category ID
  activityName: string;
  activitySortOrder?: number;
  estimatedHours?: number;
  notes?: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Manpower {
  id?: number;
  activityId: string;
  date: string;
  manpower: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SummaryManpower {
  project_id: number;
  project_name: string;
  jobNumber: string; // Add this line
  year: number;
  month: number;
  total_manpower: number;
  days_with_manpower: number;
  average_manpower_per_day_with_manpower: number;
}

// User TypeScript Interface
export type User = {
  id?: string;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  permission_level: string;
  created_at?: string | null;
  updated_at?: string | null;
};

// types.ts

export interface Equipment {
  id?: number;
  projectId: number;
  equipmentName: string;
  sortOrder?: number;
  costPerDay: number;
  costPerWeek: number;
  costPerMonth: number;
  deliveryFee: number;
  pickupFee: number;
  notes?: string;
  createdAt: date;
  updatedAt: date;
}

export interface LaborSnapshot {
  snapshotId: string; // ISO string representing the date and time
  projectId: number; // The project ID related to this snapshot
  createdAt: Date; // The timestamp when the snapshot was created
  snapshotData: text; // The labor data stored as a JSON object
}

// types.d.ts

// Interface for Vendor
export interface Vendor {
  id?: number;
  vendorName: string;
  vendorAddress?: string;
  vendorCity?: string;
  vendorState?: string;
  vendorZip?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  vendorContact?: string;
  internalVendorId?: string;
  taxable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id?: number;
  vendorId: number;
  poNumber: string;
  jobId: number; // Changed from jobNumber to jobId
  projectManager: string;
  poDate: Date;
  dueDate?: Date;
  shipTo?: string;
  amount?: string;
  costCode?: string;
  shortDescription: string;
  longDescription?: string;
  notes?: string;
  received?: string; // Added field
  backorder?: string; // Added field
  createdAt: Date;
  updatedAt: Date;
}

// src/app/db/types.ts

export interface PurchaseOrderUpdate {
  vendorId: number;
  poNumber: string; //used in PO Log
  jobNumber: string;
  projectManager: string;
  poDate: string; // used in PO Log
  dueDate?: string; // ISO date string
  deliveryDate?: string; // ISO date string
  shipVia?: string;
  shipTo?: string;
  shipToAddress?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  costCode?: string;
  freight?: number;
  boxingCharges?: number;
  poAmount: number;
  taxRate: string;
  taxable: boolean;
  warrantyYears?: number;
  shortDescription?: string;
  longDescription?: string;
  notes?: string;
}

export interface Attachment {
  id: number;
  tableName: string;
  recordId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  notes?: string;
  sharedLink?: string;
  uploadedAt: Date;
}

export interface AttachmentInput {
  file: File;
  tableName: string;
  recordId: number;
  notes?: string;
}

// Define the TypeScript interface for the labor data
export interface LaborData {
  id?: number;
  lastName: string | null;
  firstName: string | null;
  eid: number | null;
  day: string | null;
  date: string | null;
  projectName: string | null;
  jobNumber: string | null;
  costCodeDivision: string | null;
  costCodeNumber: string | null;
  costCodeDescription: string | null;
  classification: string | null;
  shift?: string | null;
  payType: string | null;
  hours: number | null;
  startTime: string | null;
  endTime: string | null;
  breaks: number | null;
  mealBreaks: number | null;
  totalBreakTime: string | null;
  workLogName: string | null;
  payrollNotes: string | null;
  payrollAttachments: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Material {
  id?: number; // Primary key, optional since it's auto-generated
  name: string; // Material name
  description?: string; // Optional description of the material
  quantity: number; // Quantity in stock
  requisitionQuantity?: number; // Quantity requested in a requisition
  unit: string; // Unit of measurement (e.g., piece, box)
  photoUrl?: string; // URL for the material's photo
  createdAt: Date; // Timestamp when the record was created
  updatedAt: Date; // Timestamp when the record was last updated
}

export interface Requisition {
  id: number; // Primary key, auto-incremented
  materialId: number; // Foreign key to the materials table
  materialName?: string; // Optional, derived from the materials table
  jobId?: number; // Optional, foreign key to the jobs table
  jobName?: string; // Optional, derived from the jobs table
  quantity: number; // Quantity requested
  requestedBy: string; // UUID of the user who requested
  jobId: string; // Optional, foreign key to the jobs table
  userName?: string; // Optional, derived from the users table
  status: "requested" | "delivered" | "canceled"; // Enum for status
  comments: string; // Optional comments
  createdAt: string; // Timestamp when the requisition was created
  updatedAt: string; // Timestamp when the requisition was last updated
}
