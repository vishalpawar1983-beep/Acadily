import { z } from 'zod';

export const markAttendanceSchema = z.object({
  body: z.object({
    batchId: z.string().min(1, 'Batch ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(0).max(11),
    year: z.number().int().min(2000).max(2100),
    status: z.enum(['P', 'A']),
  }),
});

export const getBatchAttendanceSchema = z.object({
  params: z.object({
    batchId: z.string().min(1, 'Batch ID is required'),
  }),
  query: z.object({
    month: z.coerce.number().int().min(0).max(11),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
});

export const getStudentAttendanceSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
  query: z.object({
    month: z.coerce.number().int().min(0).max(11).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});
