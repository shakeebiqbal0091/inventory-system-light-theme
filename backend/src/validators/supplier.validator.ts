import { z } from 'zod';

export const createSupplierSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required.'),
  contactPerson: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email.').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  paymentTerms: z.string().trim().optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
});
export const updateSupplierSchema = createSupplierSchema.partial();