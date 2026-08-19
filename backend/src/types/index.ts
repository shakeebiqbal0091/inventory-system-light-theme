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
