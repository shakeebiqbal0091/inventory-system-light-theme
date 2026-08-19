// src/validators/sale.validator.ts
import { z } from 'zod';

export const createSaleSchema = z.object({
  productId: z.string().min(1, 'productId is required.'),
  quantity: z.coerce.number().int('Quantity must be a whole number.').positive('Quantity must be greater than 0.'),
});