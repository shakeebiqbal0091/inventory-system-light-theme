// src/validators/product.validator.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  category: z.string().trim().min(1, 'Category is required.'),
  price: z.coerce.number().positive('Price must be greater than 0.'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative.').optional(),
  quantity: z.coerce.number().int('Quantity must be a whole number.').min(0, 'Quantity cannot be negative.'),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  supplier: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export const updateProductSchema = createProductSchema.partial();