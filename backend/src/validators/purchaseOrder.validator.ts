import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required.'),
  expectedDate: z.string().optional(),
  notes: z.string().trim().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required.'),
      quantityOrdered: z.coerce.number().int().positive('Quantity must be greater than 0.'),
      unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative.'),
    })
  ).min(1, 'At least one item is required.'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['SENT', 'CANCELLED']),
});

export const receiveStockSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      quantityReceived: z.coerce.number().int().min(0),
      damagedCount: z.coerce.number().int().min(0).optional(),
      qualityNotes: z.string().trim().optional(),
      warehouseId: z.string().optional(),   // ← added, optional
    })
  ).min(1, 'At least one item is required.'),
});