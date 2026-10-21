
import { z } from 'zod';

export const createWhatsAppOrderSchema = z.object({
  providerEventId: z.string().trim().min(1).max(255),
  customerConfirmed: z.literal(true),
  customerName: z.string().trim().min(1),
  whatsappNumber: z.string().trim().regex(/^\+?\d{5,30}$/),
  shippingAddress: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(
    z.object({
      productId: z.string().trim().min(1),
      quantity: z.coerce.number().int().positive().max(10000),
    })
  ).min(1).max(100),
});