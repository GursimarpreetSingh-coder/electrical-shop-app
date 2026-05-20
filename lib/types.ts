import type { EXPENSE_CATEGORIES, INVENTORY_CATEGORIES, PROBLEM_TYPES } from "./constants";

export type UserRole = "owner" | "staff" | "worker";

export type ServiceStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "completed"
  | "closed";

export type WorkOrderStatus =
  | "pending"
  | "in_progress"
  | "materials_logged"
  | "completed";

export type RequestSource = "qr" | "manual";

export type ProblemType = (typeof PROBLEM_TYPES)[number];

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export type QrLinkType = "shop" | "worker" | "invoice" | "site";

export type PartyType = "customer" | "supplier" | "worker";

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

export type WageType = "daily" | "monthly";

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone?: string;
  settings?: Record<string, unknown>;
}

export interface AppUser {
  id: string;
  uid: string;
  role: UserRole;
  email?: string;
  phone?: string;
  displayName: string;
  workerId?: string;
  shopId: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
  tags?: string[];
  installedItems?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRequest {
  id: string;
  shopId: string;
  customerId: string;
  source: RequestSource;
  qrToken?: string;
  problemType: ProblemType;
  description: string;
  voiceTranscript?: string;
  preferredTime?: string;
  paymentNotes?: string;
  photos: string[];
  status: ServiceStatus;
  assignedWorkerIds?: string[];
  referenceCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  id: string;
  shopId: string;
  requestId: string;
  customerId: string;
  workerIds: string[];
  status: WorkOrderStatus;
  materials: { name: string; qty: number; note?: string }[];
  sitePhotos: string[];
  beforePhotos: string[];
  afterPhotos: string[];
  report?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  shopId: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  qty: number;
  unit: string;
  price: number;
  supplierId?: string;
  minStock: number;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryTransaction {
  id: string;
  shopId: string;
  itemId: string;
  type: "in" | "out" | "adjust";
  qty: number;
  note?: string;
  ref?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  shopId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  voiceNote?: string;
  receiptUrl?: string;
  date: string;
  createdAt: Date;
}

export interface Worker {
  id: string;
  shopId: string;
  userId?: string;
  name: string;
  phone: string;
  wageType: WageType;
  rate: number;
  advances: number;
  skills?: string;
  active: boolean;
  createdAt: Date;
}

export interface Attendance {
  id: string;
  shopId: string;
  workerId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}

export interface BillLineItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Bill {
  id: string;
  shopId: string;
  customerId: string;
  lineItems: BillLineItem[];
  total: number;
  paid: number;
  due: number;
  status: "draft" | "sent" | "partial" | "paid";
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  shopId: string;
  partyType: PartyType;
  partyId: string;
  partyName: string;
  debit: number;
  credit: number;
  note: string;
  date: string;
  createdAt: Date;
}

export interface QrLink {
  id: string;
  shopId: string;
  token: string;
  type: QrLinkType;
  label: string;
  active: boolean;
  createdAt: Date;
}
