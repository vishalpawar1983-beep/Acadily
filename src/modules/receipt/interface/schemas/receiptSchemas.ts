import { z } from 'zod';

export const updateReceiptCounterSchema = z.object({
  body: z.object({
    prefix: z.string().min(1).max(10).optional(),
    currentValue: z.number().int().min(0).optional(),
  }),
});
