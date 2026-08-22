import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(1, 'Warehouse name is required.'),
  address: z.string().trim().optional(),
});
export const updateWarehouseSchema = createWarehouseSchema.partial();

export const transferStockSchema = z.object({
  productId: z.string().min(1),
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0.'),
}).refine((d) => d.fromWarehouseId !== d.toWarehouseId, {
  message: 'Source and destination warehouses must be different.',
  path: ['toWarehouseId'],
});