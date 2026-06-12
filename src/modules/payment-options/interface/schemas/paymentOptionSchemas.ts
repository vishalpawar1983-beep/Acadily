import { z } from 'zod';

export const createPaymentOptionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    isActive: z.boolean().optional(),
    createdBy: z.string().optional(),
  }),
});

export const updatePaymentOptionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment option ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listPaymentOptionsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
  }),
});

export const deletePaymentOptionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Payment option ID is required'),
  }),
});
