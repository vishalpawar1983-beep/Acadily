import { z } from 'zod';

export const createLabSchema = z.object({
  body: z.object({
    labName: z.string().min(1, 'Lab name is required').max(200),
    isActive: z.boolean().optional(),
  }),
});

export const updateLabSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Lab ID is required'),
  }),
  body: z.object({
    labName: z.string().min(1).max(200).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listLabsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const getLabSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Lab ID is required'),
  }),
});

export const deleteLabSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Lab ID is required'),
  }),
});
