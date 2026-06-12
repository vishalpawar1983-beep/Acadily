import { z } from 'zod';

export const createCourseTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Course type name is required').max(100),
  }),
});

export const updateCourseTypeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Course type ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
  }),
});

export const getCourseTypeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Course type ID is required'),
  }),
});

export const deleteCourseTypeSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Course type ID is required'),
  }),
});

export const listCourseTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});
