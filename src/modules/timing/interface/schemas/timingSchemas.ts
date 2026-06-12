import { z } from 'zod';

export const createTimingSchema = z.object({
  body: z.object({
    startTime: z.string().min(1, 'Start time is required').max(10),
    endTime: z.string().min(1, 'End time is required').max(10),
    isActive: z.boolean().optional(),
  }),
});

export const updateTimingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Timing ID is required'),
  }),
  body: z.object({
    startTime: z.string().min(1).max(10).optional(),
    endTime: z.string().min(1).max(10).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listTimingsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const getTimingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Timing ID is required'),
  }),
});

export const deleteTimingSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Timing ID is required'),
  }),
});
