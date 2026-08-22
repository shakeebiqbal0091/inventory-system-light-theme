// src/types/index.ts
import { Role } from '@prisma/client';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ─── CreateSalesOrderInput ─────────────────────────────────────────────────────────────────

export interface CreateSalesOrderInput {
  customerId?: string;
  channel?: 'ONLINE' | 'IN_STORE' | 'WHOLESALE';
  notes?: string;
  items: { productId: string; quantity: number }[];
}

export interface UpdateOrderStatusInput {
  status: 'PACKING' | 'SHIPPED' | 'CANCELLED';
}

export interface CreateShipmentInput {
  carrierName?: string;
  trackingNumber?: string;
  shipDate?: string;
  packingSlipNotes?: string;
}

export interface CreateReturnInput {
  saleId?: string;
  reason: string;
  disposition?: 'RESTOCK' | 'WRITE_OFF';
  quantity: number;
}


// ─── Products ─────────────────────────────────────────────────────────────────



export interface CreateProductInput {
  name: string;
  category: string;
  price: number;
  costPrice?: number;        // ← added
  quantity: number;
  lowStockThreshold?: number;
  supplier?: string;
  description?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export interface CreateSupplierInput {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
}
export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {}

export interface CreateCustomerInput {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  shippingAddress?: string;
  billingAddress?: string;
}
export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  expectedDate?: string;
  notes?: string;
  items: { productId: string; quantityOrdered: number; unitCost: number }[];
}

export interface UpdatePOStatusInput {
  status: 'SENT' | 'CANCELLED';
}

export interface ReceiveStockInput {
  items: { itemId: string; quantityReceived: number; damagedCount?: number; qualityNotes?: string }[];
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export interface CreateSaleInput {
  productId: string;
  quantity: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}
