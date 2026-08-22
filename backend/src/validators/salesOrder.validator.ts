import { z } from 'zod';

export const createSalesOrderSchema = z.object({
  customerId: z.string().optional(),
  channel: z.enum(['ONLINE', 'IN_STORE', 'WHOLESALE']).optional(),
  notes: z.string().trim().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required.'),
      quantity: z.coerce.number().int().positive('Quantity must be greater than 0.'),
    })
  ).min(1, 'At least one item is required.'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PACKING', 'SHIPPED', 'CANCELLED']),
});

export const createShipmentSchema = z.object({
  carrierName: z.string().trim().optional(),
  trackingNumber: z.string().trim().optional(),
  shipDate: z.string().optional(),
  packingSlipNotes: z.string().trim().optional(),
});

export const createReturnSchema = z.object({
  saleId: z.string().optional(),
  reason: z.string().trim().min(1, 'Reason is required.'),
  disposition: z.enum(['RESTOCK', 'WRITE_OFF']).optional(),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0.'),
});