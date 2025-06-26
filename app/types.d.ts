// Import the database types from schema
import type {
  BIMModel,
  NewBIMModel,
  BIMElement,
  NewBIMElement,
  MaterialTakeoff,
  NewMaterialTakeoff,
  TakeoffItem,
  NewTakeoffItem,
  ModelView,
  NewModelView,
  ModelComment,
  NewModelComment,
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
// API RESPONSE TYPES - Wrap database types for API responses
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: {
    items: T[];
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  };
  error?: string;
}

// Specific API response types using schema types
export type BIMModelResponse = ApiResponse<BIMModel>;
export type BIMModelsResponse = ApiResponse<BIMModel[]>;
export type BIMElementsResponse = PaginatedResponse<BIMElement>;
export type TakeoffResponse = ApiResponse<{
  takeoff: MaterialTakeoff;
  items: TakeoffItem[];
  summary: TakeoffSummary;
}>;

// =============================================================================
// UI/COMPONENT SPECIFIC TYPES - Not in database
// =============================================================================

export interface BIMViewerProps {
  modelId: number;
  modelPath: string;
  initialView?: ModelView;
  showTakeoffTools?: boolean;
  onElementSelect?: (element: BIMElement) => void;
  onTakeoffUpdate?: (items: TakeoffItem[]) => void;
  enableComments?: boolean;
  enableMeasurement?: boolean;
}

export interface ViewerState {
  isLoading: boolean;
  selectedElement?: BIMElement;
  activeView?: ModelView;
  showProperties: boolean;
  showTakeoffs: boolean;
  measurementMode: boolean;
  commentMode: boolean;
}

export interface CameraPosition {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  upX?: number;
  upY?: number;
  upZ?: number;
}

export interface MeasurementResult {
  type: "distance" | "area" | "volume";
  value: number;
  unit: string;
  points: { x: number; y: number; z: number }[];
}

// =============================================================================
// BUSINESS LOGIC TYPES - Extended from database types
// =============================================================================

// Extend database types with computed properties for UI
export interface ExtendedBIMModel extends BIMModel {
  // Computed fields not stored in database
  displayName: string;
  isProcessing: boolean;
  elementCount: number;
  processingProgress?: number;
  canEdit: boolean;
  formattedFileSize: string;
  formattedUploadDate: string;
}

export interface ExtendedTakeoffItem extends TakeoffItem {
  // Add computed fields for UI
  isSelected?: boolean;
  hasErrors?: boolean;
  calculatedQuantity?: number;
  pricePerUnit?: number;
}

// =============================================================================
// FORM INPUT TYPES - For creating new records
// =============================================================================

// Use the NewBIMModel type from schema, but customize for file uploads
export interface CreateBIMModelInput {
  name: string;
  description?: string;
  projectId?: number;
  file: File; // File object not stored in DB
}

// Extend schema type for takeoff creation
export interface CreateTakeoffInput
  extends Omit<NewMaterialTakeoff, "id" | "createdDate"> {
  rules?: TakeoffRule[];
  elementFilters?: ElementFilter[];
}

export interface CreateCommentInput
  extends Omit<NewModelComment, "id" | "createdAt"> {
  attachmentFiles?: File[]; // Files not stored directly in DB
}

// =============================================================================
// PROCESSING & ANALYSIS TYPES
// =============================================================================

export interface IFCParseResult {
  elements: NewBIMElement[]; // Use schema type for consistency
  metadata: {
    totalElements: number;
    elementTypes: { [type: string]: number };
    levels: string[];
    materials: string[];
    ifcSchema: string;
    boundingBox?: {
      min: { x: number; y: number; z: number };
      max: { x: number; y: number; z: number };
    };
  };
}

export interface TakeoffRule {
  elementType: string;
  materialCategory: string;
  quantityProperty: string; // Which IFC property to use for quantity
  unit: string;
  defaultUnitCost?: number;
  calculationFormula?: string; // For complex calculations
}

export interface ElementFilter {
  elementTypes?: string[];
  levels?: string[];
  materials?: string[];
  properties?: { [key: string]: any };
}

export interface TakeoffSummary {
  totalItems: number;
  totalCost: number;
  totalQuantity: number;
  categoryTotals: { [category: string]: number };
  materialTotals: { [material: string]: number };
  unitTotals: { [unit: string]: number };
}

// =============================================================================
// 3D VIEWER SPECIFIC TYPES
// =============================================================================

export interface ViewerControls {
  orbit: boolean;
  pan: boolean;
  zoom: boolean;
  select: boolean;
}

export interface RenderSettings {
  showGrid: boolean;
  showAxes: boolean;
  wireframe: boolean;
  transparency: number;
  colorScheme: "default" | "by-type" | "by-material" | "by-level";
  backgroundType: "gradient" | "solid" | "environment";
}

export interface SelectionInfo {
  element?: BIMElement;
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  distance: number;
}

// =============================================================================
// FILE HANDLING TYPES
// =============================================================================

export interface FileUploadProgress {
  fileName: string;
  progress: number; // 0-100
  stage: "uploading" | "processing" | "completed" | "error";
  message?: string;
}

export interface ProcessingStatus {
  modelId: number;
  status: "pending" | "processing" | "completed" | "error";
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  estimatedTimeRemaining?: number; // seconds
  errorMessage?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Helper type for partial updates
export type PartialUpdate<T> = Partial<T> & { id: number };

// For search and filtering
export interface SearchParams {
  query?: string;
  elementType?: string;
  material?: string;
  level?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// For bulk operations
export interface BulkOperation<T> {
  action: "create" | "update" | "delete";
  items: T[];
  options?: {
    validateFirst?: boolean;
    continueOnError?: boolean;
  };
}

export interface BulkOperationResult<T> {
  success: boolean;
  processed: number;
  failed: number;
  results: T[];
  errors: { index: number; error: string }[];
}

// =============================================================================
// RE-EXPORT DATABASE TYPES for convenience
// =============================================================================

// Re-export the main database types so components can import from one place
export type {
  BIMModel,
  NewBIMModel,
  BIMElement,
  NewBIMElement,
  MaterialTakeoff,
  NewMaterialTakeoff,
  TakeoffItem,
  NewTakeoffItem,
  ModelView,
  NewModelView,
  ModelComment,
  NewModelComment,
};
