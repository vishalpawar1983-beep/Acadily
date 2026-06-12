import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    company: z.string().max(200).optional(),
    contactPhone: z.string().max(20).optional(),
    companySite: z.string().max(200).optional(),
    country: z.string().max(100).optional(),
    language: z.string().max(50).optional(),
    timeZone: z.string().max(100).optional(),
    currency: z.string().max(10).optional(),
    communications: z
      .object({
        email: z.boolean(),
        phone: z.boolean(),
      })
      .optional(),
    allowMarketing: z.boolean().optional(),
  }),
});
