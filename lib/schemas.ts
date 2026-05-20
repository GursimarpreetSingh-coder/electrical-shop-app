import { z } from "zod";
import { EXPENSE_CATEGORIES, INVENTORY_CATEGORIES, PROBLEM_TYPES } from "./constants";

export const serviceRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone required"),
  address: z.string().min(3, "Address is required"),
  problemType: z.enum(PROBLEM_TYPES),
  description: z.string().min(5, "Describe the problem"),
  preferredTime: z.string().optional(),
  paymentNotes: z.string().optional(),
  voiceTranscript: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  address: z.string().min(3),
  balance: z.coerce.number().default(0),
  tags: z.string().optional(),
  installedItems: z.string().optional(),
  notes: z.string().optional(),
});

export const inventoryItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  category: z.enum(INVENTORY_CATEGORIES),
  qty: z.coerce.number().min(0),
  unit: z.string().min(1),
  price: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
  barcode: z.string().optional(),
  supplierId: z.string().optional(),
});

export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive(),
  description: z.string().min(2),
  voiceNote: z.string().optional(),
  date: z.string().min(1),
});

export const workerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  wageType: z.enum(["daily", "monthly"]),
  rate: z.coerce.number().positive(),
  skills: z.string().optional(),
});

export const billSchema = z.object({
  customerId: z.string().min(1),
  lineItems: z.array(
    z.object({
      description: z.string().min(1),
      qty: z.coerce.number().positive(),
      rate: z.coerce.number().min(0),
      amount: z.coerce.number().min(0),
    })
  ).min(1),
  paid: z.coerce.number().min(0).default(0),
});

export const loginEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginPhoneSchema = z.object({
  phone: z.string().min(10),
});

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type WorkerFormData = z.infer<typeof workerSchema>;
export type BillFormData = z.infer<typeof billSchema>;
