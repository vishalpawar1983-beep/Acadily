import { z } from 'zod';

export const createTrainerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    specialization: z.string().max(200).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listTrainersSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const getTrainerSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Trainer ID is required'),
  }),
});

export const updateTrainerSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Trainer ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    specialization: z.string().max(200).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const deleteTrainerSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Trainer ID is required'),
  }),
});
