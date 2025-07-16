// Import the database types from schema
import type {
  BIMModel,
  NewBIMModel,
  BIMElement,
  NewBIMElement,
} from "./db/schema";

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

export interface Customer {
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
  jobNumber?: string; // Optional, for backward compatibility
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ManpowerRecord {
  id: number;
  activityId: number;
  date: string;
  manpower: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteImpactSummary {
  categoryCount?: number;
  activityCount: number;
  manpowerCount: number;
  totalEstimatedHours?: number;
}

export interface DeleteConfirmationData {
  type: "category" | "activity";
  id: number;
  name: string;
  impact: DeleteImpactSummary;
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

// Shared type definitions for safety forms
export type FormSubmission = {
  id: number;
  formName: string;
  pdfName: string;
  jobName: string;
  userName: string;
  dateCreated: string;
  submissionDate: Date;
  formData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
};

// Begin Opti

export interface Part {
  id: number;
  userId?: string;
  partNo: string;
  length: number;
  markNo: string;
  finish?: string;
  fab?: string;
  createdAt?: Date;
  qty?: number; // For handling multiple quantities of the same part
}

export interface Bar {
  id: number;
  length: number;
  qty: number;
  maxQty?: number; // For tracking original quantities
  partNo?: string; // Associate bar with specific part number
  description?: string; // Optional description of the bar (material type, etc.)
}

export interface BarCut {
  partId: number;
  barId: number;
  barNo: number;
  position: number;
  length: number;
  markNo: string;
  finish?: string;
  fab?: string;
  partNo: string;
}

export interface CutBar {
  barId: number;
  barNo: number;
  length: number;
  usedLength: number;
  wastePercentage: number;
  cuts: BarCut[];
  partNo?: string; // Add part number to tracking
  description?: string; // Add description for reference
}

export interface BarOptimizationResult {
  cuts: BarCut[];
  bars: CutBar[];
  summary: {
    totalBars: number;
    totalLength: number;
    usedLength: number;
    wastePercentage: number;
    totalPartsPlaced: number;
    totalPartsNeeded: number;
    barTypesUsed: number;
  };
  optimalBar?: {
    length: number;
  };
}

// Begin Panel Optimization

export interface Panel {
  id: number;
  qty: number;
  part_no?: string;
  width: number;
  height: number;
  mark_no: string;
  finish?: string;
}

export interface Sheet {
  id: number;
  width: number;
  height: number;
  qty: number;
  maxQty?: number;
}

export interface PanelCutPatternItem {
  stockId: number;
  sheetId: number;
  sheetNo: number;
  stockLength: number;
  cuts: Cut[];
  remainingLength: number;
}

export interface Placement {
  panelId: number;
  sheetId: number;
  sheetNo: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  mark: string;
}

export interface Cut {
  part_no: string;
  length: number;
  height: number;
  mark: string;
  finish: string;
  fab: string;
}

export interface CutSheet {
  sheetId: number;
  sheetNo: number;
  width: number;
  height: number;
  usedArea: number;
  wastePercentage: number;
}

export interface PanelOptimizationResult {
  placements: Placement[];
  sheets: CutSheet[];
  summary: {
    totalSheets: number;
    totalArea: number;
    usedArea: number;
    wastePercentage: number;
    totalPanelsPlaced: number;
    totalPanelsNeeded: number;
    sheetTypesUsed: number;
  };
  optimalSheet?: {
    width: number;
    height: number;
  };
}

export interface GlassData {
  Handle: string;
  GlassType: string;
  Floor: string;
  Elevation: string;
  Coordinates: number[];
  GlassBiteLeft: number;
  GlassBiteRight: number;
  GlassBiteTop: number;
  GlassBiteBottom: number;
}

export interface TakeoffRequest {
  drawing: string;
  glassItems: GlassData[];
}

export interface ProcessedGlassData {
  Handle: string;
  MarkNumber: string;
  // Add other fields as needed
}

// Engineering Schedule Types

export interface Engineer {
  id: number;
  name: string;
  email: string;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngineeringTask {
  id: number;
  projectId: number;
  name: string;
  notes: string | null;
  durationDays: number;
  dueDate: string;
  status: string;
  isLastMinute: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAssignment {
  id: number;
  taskId: number;
  engineerId: number;
  position: number;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  assignedBy: string;
  assignedAt: Date;
}

export interface TaskHistory {
  id: number;
  taskId: number;
  action: string;
  details: any;
  performedBy: string;
  performedAt: Date;
}

export interface EngineerWithTasks extends Engineer {
  tasks: TaskWithAssignment[];
}

export interface TaskWithAssignment extends EngineeringTask {
  project: Project | ProjectFromDB; // Allow both types
  assignment?: TaskAssignment | null; // Allow both undefined and null
  isAtRisk?: boolean;
  isOverdue?: boolean;
}

export interface TaskMoveData {
  taskId: number;
  fromEngineerId?: number;
  toEngineerId?: number;
  fromPosition?: number;
  toPosition: number;
}

export interface ScheduleData {
  engineers: EngineerWithTasks[];
  unassignedTasks: TaskWithAssignment[];
}

export interface GanttTask {
  id: number;
  name: string;
  engineerId: number;
  engineerName: string;
  start: Date;
  end: Date;
  status: string;
  projectName: string;
  isOverdue: boolean;
  isAtRisk: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// Form types for creating/updating
export interface CreateTaskForm {
  projectId: number;
  name: string;
  notes?: string;
  durationDays: number;
  dueDate: string;
  isLastMinute?: boolean;
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  status?: string;
}

export interface CreateEngineerForm {
  name: string;
  email: string;
}

// Helper type for history tracking
export interface HistoryDetail {
  field?: string;
  oldValue?: any;
  newValue?: any;
  fromEngineerId?: number;
  toEngineerId?: number;
  fromPosition?: number;
  toPosition?: number;
}

export interface StartDateChangeConfirmation {
  showDialog: boolean;
  projectData: Partial<Project>;
  onConfirm: (adjustLabor: boolean) => void;
  onCancel: () => void;
}

// TypeScript interfaces for Engineering Notes

// Updated TypeScript interfaces for Custom Status System

// Custom status interfaces
export interface NoteStatus {
  id: number;
  projectId: number;
  name: string;
  color: string; // e.g., "blue", "pink", "green"
  bgColor: string; // e.g., "bg-blue-50"
  borderColor: string; // e.g., "border-blue-200"
  textColor: string; // e.g., "text-blue-800"
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Updated engineering note interfaces
export interface EngineeringNote {
  id: number;
  categoryId: number;
  statusId: number | null;
  title: string;
  content: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngineeringNoteWithStatuses extends EngineeringNote {
  statuses: NoteStatus[]; // Array of status badges
}

export interface EngineeringNoteWithStatus extends EngineeringNote {
  status: NoteStatus | null;
}

export interface EngineeringNoteWithCategory extends EngineeringNote {
  category: NoteCategory;
  status: NoteStatus | null;
}

export interface EngineeringNoteWithChecklists extends EngineeringNote {
  checklists: NoteChecklistWithItems[];
  status: NoteStatus | null;
  statuses: NoteStatus[]; // Array of status badges
}

export interface NoteCategory {
  id: number;
  projectId: number;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteCategoryWithNotes extends NoteCategory {
  notes: EngineeringNoteWithStatuses[]; // Change this from EngineeringNoteWithStatus[]
}

export interface NoteChecklist {
  id: number;
  noteId: number;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteChecklistItem {
  id: number;
  checklistId: number;
  text: string;
  checked: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteChecklistWithItems extends NoteChecklist {
  items: NoteChecklistItem[];
}

// Updated form interfaces
export interface CreateNoteStatusForm {
  projectId: number;
  name: string;
  color: string;
}

export interface UpdateNoteStatusForm {
  name?: string;
  color?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface CreateEngineeringNoteForm {
  categoryId: number;
  title: string;
  content?: string;
  statusId?: number; // Changed from status string
}

export interface UpdateEngineeringNoteForm {
  title?: string;
  content?: string;
  categoryId?: number;
  sortOrder?: number;
  statusIds?: number[]; // Array of status IDs to assign
}

// New interfaces for managing status assignments
export interface AssignStatusToNoteForm {
  noteId: number;
  statusId: number;
}

export interface RemoveStatusFromNoteForm {
  noteId: number;
  statusId: number;
}

// Keep other existing form interfaces unchanged
export interface CreateNoteCategoryForm {
  projectId: number;
  name: string;
}

export interface UpdateNoteCategoryForm {
  name?: string;
  sortOrder?: number;
}

export interface CreateNoteChecklistForm {
  noteId: number;
  name: string;
}

export interface CreateNoteChecklistItemForm {
  checklistId: number;
  text: string;
}

export interface UpdateNoteChecklistItemForm {
  text?: string;
  checked?: boolean;
  sortOrder?: number;
}

export interface ReorderCategoriesForm {
  projectId: number;
  orderedCategoryIds: number[];
}

export interface ReorderNotesForm {
  categoryId: number;
  orderedNoteIds: number[];
}

export interface ReorderChecklistItemsForm {
  checklistId: number;
  orderedItemIds: number[];
}

export interface ReorderStatusesForm {
  projectId: number;
  orderedStatusIds: number[];
}

export interface ChecklistSummary {
  completedItems: number;
  totalItems: number;
}

// Color options for status creation
export const STATUS_COLOR_OPTIONS = [
  {
    value: "blue",
    label: "Blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    preview: "bg-blue-500",
  },
  {
    value: "pink",
    label: "Pink",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-800",
    preview: "bg-pink-500",
  },
  {
    value: "green",
    label: "Green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    preview: "bg-green-500",
  },
  {
    value: "red",
    label: "Red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    preview: "bg-red-500",
  },
  {
    value: "yellow",
    label: "Yellow",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    preview: "bg-yellow-500",
  },
  {
    value: "purple",
    label: "Purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-800",
    preview: "bg-purple-500",
  },
  {
    value: "indigo",
    label: "Indigo",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-800",
    preview: "bg-indigo-500",
  },
  {
    value: "gray",
    label: "Gray",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-800",
    preview: "bg-gray-500",
  },
  {
    value: "orange",
    label: "Orange",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    preview: "bg-orange-500",
  },
  {
    value: "teal",
    label: "Teal",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-800",
    preview: "bg-teal-500",
  },
] as const;

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Specific API response types
export type BIMModelResponse = ApiResponse<BIMModel>;
export type BIMModelsResponse = ApiResponse<BIMModel[]>;
export type BIMElementsResponse = ApiResponse<BIMElement[]>;

// =============================================================================
// VIEWER COMPONENT TYPES
// =============================================================================

export interface ElementSelectionEvent {
  element: BIMElement;
  position: THREE.Vector3;
  mesh: THREE.Object3D;
}

export interface BIMViewerProps {
  model: BIMModel;
  onElementSelect?: (event: ElementSelectionEvent) => void;
  className?: string;
}

export interface ViewerControls {
  resetView: () => void;
  focusElement: (elementId: string) => void;
  toggleWireframe: () => void;
  toggleGrid: () => void;
}

// =============================================================================
// FORM INPUT TYPES
// =============================================================================

export interface CreateBIMModelInput {
  name: string;
  description?: string;
  projectId?: number;
  file: File;
}

// Additional input type for the createBIMModel action
export interface CreateBIMModelData {
  name: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  projectId?: number;
  uploadedBy?: number;
}

// =============================================================================
// ACTION RESPONSE TYPES
// =============================================================================

export interface SaveElementsResult {
  success: boolean;
  count: number;
}

export interface DeleteResult {
  success: boolean;
}

export interface ProcessModelResult {
  success: boolean;
  elementCount: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Helper type for partial updates
export type PartialUpdate<T> = Partial<T> & { id: number };

// For basic search and filtering
export interface SearchParams {
  query?: string;
  elementType?: string;
  page?: number;
  pageSize?: number;
}

// Camera position for saving/loading views
export interface CameraPosition {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

// =============================================================================
// DATABASE TYPES - Import from schema
// =============================================================================

export type {
  BIMModel,
  NewBIMModel,
  BIMElement,
  NewBIMElement,
} from "./db/schema";

// ************************** Begin Holidays Management Types **************************

export type HolidayType = "field" | "office" | "both";

export interface Holiday {
  id: number;
  date: string; // ISO date string (YYYY-MM-DD)
  name: string;
  description?: string;
  type: HolidayType;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  description?: string;
  type: HolidayType;
  isRecurring?: boolean;
}

export interface UpdateHolidayRequest {
  id: number;
  date?: string;
  name?: string;
  description?: string;
  type?: HolidayType;
  isRecurring?: boolean;
}

export interface DeleteHolidayRequest {
  id: number;
}

export interface GetHolidaysRequest {
  type?: HolidayType;
  startDate?: string;
  endDate?: string;
  year?: number;
}

export interface HolidayFilters {
  type?: HolidayType;
  startDate?: string;
  endDate?: string;
  year?: number;
}

export interface HolidayResponse {
  holidays: Holiday[];
  total: number;
}

// Form validation types
export interface HolidayFormData {
  date: string;
  name: string;
  description: string;
  type: HolidayType;
  isRecurring: boolean;
}

export interface HolidayFormErrors {
  date?: string;
  name?: string;
  description?: string;
  type?: string;
  general?: string;
}

// Utility type for holiday display
export interface HolidayDisplayData extends Holiday {
  formattedDate: string;
  isUpcoming: boolean;
  isPast: boolean;
}

// +++++++++++++++ Begin Estimate Management Types +++++++++++++++
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This file defines TypeScript interfaces for the Glazing Estimation System

// types.ts - TypeScript interfaces for Glazing Estimation System

// types.ts - TypeScript interfaces for Glazing Estimation System

export interface Estimate {
  id: number;
  estimateNumber: string;
  name: string;
  description: string | null;
  buildingType: string | null;
  location: string | null;
  architect: string | null;
  contractor: string | null;
  owner: string | null;
  bidDate: Date | null;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  totalSquareFootage: string | null; // Drizzle returns decimals as strings
  storiesBelowGrade: number;
  storiesAboveGrade: number;
  status:
    | "active"
    | "on_hold"
    | "bid_submitted"
    | "awarded"
    | "lost"
    | "cancelled"
    | "no_bid";
  estimatedValue: string | null; // Drizzle returns decimals as strings
  confidenceLevel: "high" | "medium" | "low" | null;
  competitionLevel: "high" | "medium" | "low" | null;
  relationshipStatus: string | null;
  primaryContact: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  assignedEstimator: string | null;
  salesPerson: string | null;
  notes: string | null;
  internalNotes: string | null;
  sortOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Bid {
  id: number;
  estimateId: number;
  bidNumber: string;
  name: string;
  description: string | null;
  stage:
    | "initial_budget"
    | "hard_budget"
    | "initial_pricing"
    | "firm_estimate"
    | "final_bid"
    | "submitted";
  version: number;
  parentBidId: number | null;
  preparedBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  submittedDate: Date | null;
  totalMaterialCost: string; // Drizzle returns decimals as strings
  totalLaborCost: string;
  totalSubcontractorCost: string;
  totalEquipmentCost: string;
  totalOverheadCost: string;
  totalProfitAmount: string;
  totalBidAmount: string;
  overheadPercentage: string;
  profitPercentage: string;
  contingencyPercentage: string;
  proposedStartDate: Date | null;
  proposedCompletionDate: Date | null;
  deliveryWeeks: number | null;
  alternateRequested: boolean;
  alternateDescription: string | null;
  valueEngineeringNotes: string | null;
  exclusions: string | null;
  assumptions: string | null;
  isActive: boolean;
  isSubmitted: boolean;
  notes: string | null;
  internalNotes: string | null;
  sortOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Elevation {
  id: number;
  bidId: number;
  name: string;
  description: string | null;
  elevationType:
    | "storefront"
    | "curtain_wall"
    | "window_wall"
    | "entrance"
    | "canopy"
    | "mixed";
  totalWidth: string; // Drizzle returns decimals as strings
  totalHeight: string;
  floorHeight: string;
  floorNumber: number;
  drawingNumber: string | null;
  drawingRevision: string | null;
  gridLine: string | null;
  detailReference: string | null;
  materialCost: string;
  laborCost: string;
  totalCost: string;
  notes: string | null;
  sortOrder: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Base Opening type from database
export interface Opening {
  id: number;
  elevationId: number;
  name: string;
  openingMark?: string | null;

  // Geometry
  startPosition: string; // Decimal stored as string
  width: string;
  height: string;
  sillHeight: string;

  // Opening type and features
  openingType: string;
  glazingSystem?: string | null;
  hasTransom: boolean;
  transomHeight?: string | null;

  // Grid Definition
  gridColumns: number;
  gridRows: number;
  mullionWidth: string; // Decimal stored as string
  spacingVertical: string; // 'equal' | 'custom'
  spacingHorizontal: string; // 'equal' | 'custom'

  // Component Names
  componentSill: string;
  componentHead: string;
  componentJambs: string;
  componentVerticals: string;
  componentHorizontals: string;

  // Performance requirements
  thermalPerformance?: string | null;
  windLoadRequirement?: string | null;
  seismicRequirement?: string | null;
  acousticRequirement?: string | null;

  // Quantity and costs
  quantity: number;
  unitMaterialCost: string;
  unitLaborCost: string;
  totalMaterialCost: string;
  totalLaborCost: string;

  // Additional fields
  description?: string | null;
  notes?: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Mullion {
  id: number;
  openingId: number;
  type: "vertical" | "horizontal";
  position: string; // Drizzle returns decimals as strings
  mullionType: "intermediate" | "structural" | "expansion" | "thermal_break";
  depth: string;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface GlassPanel {
  id: number;
  openingId: number;
  panelNumber: number;
  x: string; // Drizzle returns decimals as strings
  y: string;
  width: string;
  height: string;
  area: string;
  isTransom: boolean;
  isOperable: boolean;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Door {
  id: number;
  openingId: number;
  name: string;
  doorMark: string | null;
  position: string; // Drizzle returns decimals as strings
  width: string;
  height: string;
  doorType: "single" | "double" | "slider" | "revolving" | "automatic";
  handingType: "left" | "right" | "center" | null;
  hasVision: boolean;
  doorMaterial: string | null;
  lockType: string | null;
  closerType: string | null;
  hasAutomaticOperator: boolean;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SpecialCondition {
  id: number;
  elevationId: number;
  conditionType:
    | "corner"
    | "return"
    | "angle"
    | "step_down"
    | "canopy"
    | "soffit"
    | "column_cover";
  position: string; // Drizzle returns decimals as strings
  width: string | null;
  height: string | null;
  angle: string | null;
  description: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Composite interfaces for API responses
export interface EstimateWithBids extends Estimate {
  bids: Bid[];
  activeBid?: Bid;
}

export interface BidWithElevations extends Bid {
  elevations: ElevationWithOpenings[];
  estimate: Estimate;
}

export interface ElevationWithOpenings extends Elevation {
  openings: OpeningWithDetails[];
  specialConditions: SpecialCondition[];
}

export interface OpeningWithDetails extends Opening {
  mullions: Mullion[];
  glassPanels: GlassPanel[];
  doors: Door[];
}

// Input interfaces for creating/updating
export interface CreateEstimateInput {
  estimateNumber: string;
  name: string;
  description?: string;
  buildingType?: string;
  location?: string;
  architect?: string;
  contractor?: string;
  owner?: string;
  bidDate?: Date;
  projectStartDate?: Date;
  projectEndDate?: Date;
  totalSquareFootage?: number;
  storiesBelowGrade?: number;
  storiesAboveGrade?: number;
  estimatedValue?: number;
  confidenceLevel?: "high" | "medium" | "low";
  competitionLevel?: "high" | "medium" | "low";
  relationshipStatus?: string;
  primaryContact?: string;
  contactEmail?: string;
  contactPhone?: string;
  assignedEstimator?: string;
  salesPerson?: string;
  notes?: string;
  internalNotes?: string;
  sortOrder?: number;
}

export interface UpdateEstimateInput {
  estimateNumber?: string;
  name?: string;
  description?: string;
  buildingType?: string;
  location?: string;
  architect?: string;
  contractor?: string;
  owner?: string;
  bidDate?: Date;
  projectStartDate?: Date;
  projectEndDate?: Date;
  totalSquareFootage?: number;
  storiesBelowGrade?: number;
  storiesAboveGrade?: number;
  status?:
    | "active"
    | "on_hold"
    | "bid_submitted"
    | "awarded"
    | "lost"
    | "cancelled"
    | "no_bid";
  estimatedValue?: number;
  confidenceLevel?: "high" | "medium" | "low";
  competitionLevel?: "high" | "medium" | "low";
  relationshipStatus?: string;
  primaryContact?: string;
  contactEmail?: string;
  contactPhone?: string;
  assignedEstimator?: string;
  salesPerson?: string;
  notes?: string;
  internalNotes?: string;
  sortOrder?: number;
}

export interface CreateBidInput {
  estimateId: number;
  bidNumber: string;
  name: string;
  description?: string;
  stage?:
    | "initial_budget"
    | "hard_budget"
    | "initial_pricing"
    | "firm_estimate"
    | "final_bid"
    | "submitted"
    | undefined;
  parentBidId?: number;
  preparedBy?: string;
  overheadPercentage?: number;
  profitPercentage?: number;
  contingencyPercentage?: number;
  proposedStartDate?: Date;
  proposedCompletionDate?: Date;
  deliveryWeeks?: number;
  alternateRequested?: boolean;
  alternateDescription?: string;
  valueEngineeringNotes?: string;
  exclusions?: string;
  assumptions?: string;
  notes?: string;
  internalNotes?: string;
  sortOrder?: number;
}

export interface UpdateBidInput {
  bidNumber?: string;
  name?: string;
  description?: string;
  stage?:
    | "initial_budget"
    | "hard_budget"
    | "initial_pricing"
    | "firm_estimate"
    | "final_bid"
    | "submitted";
  preparedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  submittedDate?: Date;
  totalMaterialCost?: number;
  totalLaborCost?: number;
  totalSubcontractorCost?: number;
  totalEquipmentCost?: number;
  totalOverheadCost?: number;
  totalProfitAmount?: number;
  totalBidAmount?: number;
  overheadPercentage?: number;
  profitPercentage?: number;
  contingencyPercentage?: number;
  proposedStartDate?: Date;
  proposedCompletionDate?: Date;
  deliveryWeeks?: number;
  alternateRequested?: boolean;
  alternateDescription?: string;
  valueEngineeringNotes?: string;
  exclusions?: string;
  assumptions?: string;
  isActive?: boolean;
  isSubmitted?: boolean;
  notes?: string;
  internalNotes?: string;
  sortOrder?: number;
}

export interface CreateElevationInput {
  bidId: number;
  name: string;
  description?: string;
  elevationType?:
    | "storefront"
    | "curtain_wall"
    | "window_wall"
    | "entrance"
    | "canopy"
    | "mixed";
  totalWidth: number;
  totalHeight: number;
  floorHeight: number;
  floorNumber?: number;
  drawingNumber?: string;
  drawingRevision?: string;
  gridLine?: string;
  detailReference?: string;
  notes?: string;
  sortOrder?: number;
}

export interface UpdateElevationInput {
  name?: string;
  description?: string;
  elevationType?:
    | "storefront"
    | "curtain_wall"
    | "window_wall"
    | "entrance"
    | "canopy"
    | "mixed";
  totalWidth?: number;
  totalHeight?: number;
  floorHeight?: number;
  floorNumber?: number;
  drawingNumber?: string;
  drawingRevision?: string;
  gridLine?: string;
  detailReference?: string;
  materialCost?: number;
  laborCost?: number;
  totalCost?: number;
  notes?: string;
  sortOrder?: number;
}

// Input type for creating openings
export interface CreateOpeningInput {
  elevationId: number;
  name: string;
  openingMark?: string;

  // Geometry
  startPosition: number | string;
  width: number | string;
  height: number | string;
  sillHeight: number | string;

  // Opening type and features
  openingType: string;
  glazingSystem?: string;
  hasTransom?: boolean;
  transomHeight?: number | string;

  // Grid Definition
  gridColumns?: number;
  gridRows?: number;
  mullionWidth?: number | string;
  spacingVertical?: "equal" | "custom";
  spacingHorizontal?: "equal" | "custom";

  // Component Names
  componentSill?: string;
  componentHead?: string;
  componentJambs?: string;
  componentVerticals?: string;
  componentHorizontals?: string;

  // Performance requirements
  thermalPerformance?: string;
  windLoadRequirement?: string;
  seismicRequirement?: string;
  acousticRequirement?: string;

  // Quantity and costs
  quantity?: number;
  unitMaterialCost?: number | string;
  unitLaborCost?: number | string;
  totalMaterialCost?: number | string;
  totalLaborCost?: number | string;

  // Additional fields
  description?: string;
  notes?: string;
  sortOrder?: number;
}

// Update input type for updating openings
export interface UpdateOpeningInput extends Partial<CreateOpeningInput> {
  id: number;
}

// Enhanced opening with details (for forms and display)
export interface OpeningWithDetails extends Opening {
  // Computed fields
  area?: number; // width * height
  glassPanelCount?: number; // gridColumns * gridRows
  verticalMullionCount?: number; // gridColumns - 1
  horizontalMullionCount?: number; // gridRows - 1
  perimeter?: number; // 2 * (width + height)
}

// Grid definition type for form handling
export interface GridDefinition {
  columns: number;
  rows: number;
  mullionWidth: number;
  spacing: {
    vertical: "equal" | "custom";
    horizontal: "equal" | "custom";
  };
  components: {
    sill: string;
    head: string;
    jambs: string;
    verticals: string;
    horizontals: string;
  };
}

// Opening type enum values
export type OpeningType =
  | "window"
  | "door"
  | "curtain_wall"
  | "storefront"
  | "ribbon_window"
  | "clerestory"
  | "entrance_door"
  | "fixed_window"
  | "operable_window"
  | "vent"
  | "louver";

// Spacing type enum values
export type SpacingType = "equal" | "custom";

// API Response types
export interface CreateOpeningResponse {
  success: boolean;
  data?: Opening;
  error?: string;
}

export interface UpdateOpeningResponse {
  success: boolean;
  data?: Opening;
  error?: string;
}

export interface GetOpeningResponse {
  success: boolean;
  data?: OpeningWithDetails;
  error?: string;
}

export interface GetOpeningsResponse {
  success: boolean;
  data?: OpeningWithDetails[];
  error?: string;
}

export interface DeleteOpeningResponse {
  success: boolean;
  error?: string;
}

// Your other interfaces are perfect as-is:
export interface CreateMullionInput {
  openingId: number;
  type: "vertical" | "horizontal";
  position: number;
  mullionType: "intermediate" | "structural" | "expansion" | "thermal_break";
  depth?: number;
  notes?: string;
}

export interface CreateDoorInput {
  openingId: number;
  name: string;
  doorMark?: string;
  position: number;
  width: number;
  height: number;
  doorType: "single" | "double" | "slider" | "revolving" | "automatic";
  handingType?: "left" | "right" | "center";
  hasVision?: boolean;
  doorMaterial?: string;
  lockType?: string;
  closerType?: string;
  hasAutomaticOperator?: boolean;
  notes?: string;
}

export interface CreateSpecialConditionInput {
  elevationId: number;
  conditionType:
    | "corner"
    | "return"
    | "angle"
    | "step_down"
    | "canopy"
    | "soffit"
    | "column_cover";
  position: number;
  width?: number;
  height?: number;
  angle?: number;
  description?: string;
  notes?: string;
}

// Calculation interfaces
export interface BidSummary {
  totalGlassArea: number; // total square footage of glass
  totalFrameLinearFeet: number; // total linear feet of framing
  elevationCount: number;
  openingCount: number;
  doorCount: number;
  mullionCount: number;
  panelCount: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number;
}

export interface ElevationSummary {
  totalGlassArea: number; // total square footage of glass in this elevation
  totalFrameLinearFeet: number; // total linear feet of framing in this elevation
  openingCount: number;
  doorCount: number;
  mullionCount: number;
  panelCount: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
}

// Additional TypeScript interfaces for the grid system

// Grid Mullion interface
export interface GridMullion {
  id: number;
  openingId: number;
  gridType:
    | "vertical"
    | "horizontal"
    | "sill"
    | "head"
    | "jamb_left"
    | "jamb_right";
  gridColumn?: number | null;
  gridRow?: number | null;
  gridSegment?: number | null; // NEW - for horizontal segments
  length: string; // Decimal as string
  componentName: string;
  defaultPosition?: string | null;
  customPosition?: number | null;
  startX?: number | null; // NEW - segment start position
  endX?: number | null; // NEW - segment end position
  isActive: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Grid Glass Panel interface
export interface GridGlassPanel {
  id: number;
  openingId: number;
  gridColumn: number;
  gridRow: number;
  x: string; // Decimal as string
  y: string;
  width: string;
  height: string;
  isTransom: boolean;
  glassType: string;
  isActive: boolean;
  area?: string | null;
  unitCost: string;
  totalCost: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Grid Configuration interface
export interface GridConfiguration {
  id: number;
  openingId: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  columns: number;
  rows: number;
  mullionWidth: string;
  totalMullionLength: string;
  totalGlassArea: string;
  estimatedCost: string;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Opening interface with grid data
export interface OpeningWithGrid extends OpeningWithDetails {
  gridMullions?: GridMullion[];
  gridGlassPanels?: GridGlassPanel[];
  gridConfigurations?: GridConfiguration[];
  activeConfiguration?: GridConfiguration | null;
}

// Input interfaces for creating/updating grid elements
export interface CreateGridMullionInput {
  openingId: number;
  gridType:
    | "vertical"
    | "horizontal"
    | "sill"
    | "head"
    | "jamb_left"
    | "jamb_right";
  gridColumn?: number;
  gridRow?: number;
  gridSegment?: number; // NEW - for horizontal segments
  length: number | string;
  componentName: string;
  defaultPosition?: number | string;
  customPosition?: number;
  startX?: number; // NEW - segment start position
  endX?: number; // NEW - segment end position
  isActive?: boolean;
  notes?: string;
}

export interface UpdateGridMullionInput
  extends Partial<CreateGridMullionInput> {
  id: number;
}

export interface CreateGridGlassPanelInput {
  openingId: number;
  gridColumn: number;
  gridRow: number;
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  isTransom?: boolean;
  glassType?: string;
  isActive?: boolean;
  unitCost?: number | string;
  notes?: string;
}

export interface UpdateGridGlassPanelInput
  extends Partial<CreateGridGlassPanelInput> {
  id: number;
}

export interface CreateGridConfigurationInput {
  openingId: number;
  name: string;
  description?: string;
  isActive?: boolean;
  columns: number;
  rows: number;
  mullionWidth: number | string;
  createdBy?: string;
}

export interface UpdateGridConfigurationInput
  extends Partial<CreateGridConfigurationInput> {
  id: number;
}

// Grid calculation utilities
export interface GridDimensions {
  openingWidth: number;
  openingHeight: number;
  columns: number;
  rows: number;
  mullionWidth: number; // in inches
  hasTransom: boolean;
  transomHeight?: number;
}

export interface CalculatedGridElement {
  mullions: {
    vertical: Array<{
      column: number;
      position: number;
      length: number;
    }>;
    horizontal: Array<{
      row: number;
      position: number;
      length: number;
      startX?: number; // NEW - for segments
      endX?: number; // NEW - for segments
      segment?: number; // NEW - segment index
    }>;
    perimeter: Array<{
      type: "sill" | "head" | "jamb_left" | "jamb_right";
      length: number;
      startX?: number; // NEW - for sill/head segments
      endX?: number; // NEW - for sill/head segments
      segment?: number; // NEW - segment index for sill/head
    }>;
  };
  glassPanels: Array<{
    column: number;
    row: number;
    x: number;
    y: number;
    width: number;
    height: number;
    isTransom: boolean;
  }>;
}

// 5. NEW: More specific interfaces for calculated mullions
export interface CalculatedVerticalMullion {
  column: number;
  position: number;
  length: number;
}

export interface CalculatedHorizontalMullion {
  row: number;
  position: number;
  length: number;
  startX: number;
  endX: number;
  segment: number;
}

export interface CalculatedPerimeterMullion {
  type: "sill" | "head" | "jamb_left" | "jamb_right";
  length: number;
  startX?: number; // Only for sill/head segments
  endX?: number; // Only for sill/head segments
  segment?: number; // Only for sill/head segments
}

// 6. NEW: Better typed CalculatedGridElement
export interface TypedCalculatedGridElement {
  mullions: {
    vertical: CalculatedVerticalMullion[];
    horizontal: CalculatedHorizontalMullion[];
    perimeter: CalculatedPerimeterMullion[];
  };
  glassPanels: Array<{
    column: number;
    row: number;
    x: number;
    y: number;
    width: number;
    height: number;
    isTransom: boolean;
  }>;
}

// 7. OPTIONAL: Component-specific interfaces for the visualization
export interface GridVisualizationMullion {
  id: number;
  gridType: string;
  gridColumn?: number | null;
  gridRow?: number | null;
  gridSegment?: number | null; // NEW
  componentName: string;
  length: string;
  customPosition: number | null;
  startX?: number | null; // NEW
  endX?: number | null; // NEW
  isActive: boolean;
}

// API Response types for grid operations
export interface GridMullionResponse {
  success: boolean;
  data?: GridMullion | GridMullion[];
  error?: string;
}

export interface GridGlassPanelResponse {
  success: boolean;
  data?: GridGlassPanel | GridGlassPanel[];
  error?: string;
}

export interface GridConfigurationResponse {
  success: boolean;
  data?: GridConfiguration | GridConfiguration[];
  error?: string;
}

export interface GridRegenerateResponse {
  success: boolean;
  data?: {
    mullions: GridMullion[];
    glassPanels: GridGlassPanel[];
    stats: {
      totalMullions: number;
      totalGlassPanels: number;
      totalMullionLength: number;
      totalGlassArea: number;
    };
  };
  error?: string;
}
