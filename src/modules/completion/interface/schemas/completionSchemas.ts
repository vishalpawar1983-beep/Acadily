import { z } from 'zod';

export const recordCompletionSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
    completionDate: z.string().optional(),
    certificateNumber: z.string().optional(),
    remarks: z.string().max(500).optional(),
    status: z.enum(['completed', 'withdrawn', 'failed']).optional(),
  }),
});

export const updateCompletionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Completion ID is required'),
  }),
  body: z.object({
    completionDate: z.string().optional(),
    certificateNumber: z.string().optional(),
    remarks: z.string().max(500).optional(),
    status: z.enum(['completed', 'withdrawn', 'failed']).optional(),
  }),
});

export const listCompletionsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    studentId: z.string().optional(),
    courseId: z.string().optional(),
    status: z.enum(['completed', 'withdrawn', 'failed']).optional(),
  }),
});

export const getCompletionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Completion ID is required'),
  }),
});

export const getStudentCompletionsSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
});
