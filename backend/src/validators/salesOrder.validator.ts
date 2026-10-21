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

export const createWhatsAppOrderSchema = z.object({
providerEventId: z.string().trim().min(1),
eventType: z.string().trim().min(1),
customerName: z.string().trim().min(1).max(150),
whatsappNumber: z.string().trim().min(5).max(30),
shippingAddress: z.string().trim().max(500).optional(),
notes: z.string().trim().max(1000).optional(),
items: z.array(
z.object({
productId: z.string().trim().min(1),
quantity: z.coerce.number().int().positive().max(10000),
})
).min(1).max(100),
});
