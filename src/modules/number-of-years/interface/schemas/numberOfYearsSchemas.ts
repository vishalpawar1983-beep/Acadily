import { z } from 'zod';

export const createNumberOfYearsSchema = z.object({
  body: z.object({
    value: z.number().int().positive('Value must be a positive integer'),
  }),
});

export const updateNumberOfYearsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Number of years ID is required'),
  }),
  body: z.object({
    value: z.number().int().positive('Value must be a positive integer').optional(),
  }),
});

export const getNumberOfYearsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Number of years ID is required'),
  }),
});

export const deleteNumberOfYearsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Number of years ID is required'),
  }),
});

export const listNumberOfYearsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});
