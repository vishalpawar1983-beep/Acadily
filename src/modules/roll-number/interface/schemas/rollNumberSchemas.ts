import { z } from 'zod';

export const updateRollNumberSchema = z.object({
  body: z.object({
    prefix: z.string().max(20).optional(),
    currentValue: z.number().int().min(0).optional(),
  }),
});
