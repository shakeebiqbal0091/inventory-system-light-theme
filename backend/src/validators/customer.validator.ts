import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  company: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email.').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  shippingAddress: z.string().trim().optional(),
  billingAddress: z.string().trim().optional(),
});
export const updateCustomerSchema = createCustomerSchema.partial();