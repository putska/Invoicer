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
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id?: number;
  projectId: string;
  name: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  activities?: Activity[];
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

export interface Activity {
  id?: number;
  categoryId: string; // Reference to the Category ID
  name: string;
  sortOrder?: number;
  estimatedHours?: number;
  notes?: string;
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
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

export interface User {
  id?: number;
  email: string;
  passwordHash: string;
  canEdit: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProject {
  userId: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}
