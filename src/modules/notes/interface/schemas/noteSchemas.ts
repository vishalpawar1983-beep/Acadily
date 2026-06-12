import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    date: z.string().optional(),
    particulars: z.string().min(1, 'Particulars is required').max(2000),
    // Legacy frontend may omit addedBy; controller falls back to req.user.userId
    addedBy: z.string().optional(),
    startTime: z.string().optional(),
    // Recurring reminder: notify every day until this date (ISO date string)
    endDate: z.string().optional(),
  }),
});

export const updateNoteSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Note ID is required'),
  }),
  body: z.object({
    particulars: z.string().min(1).max(2000).optional(),
    date: z.string().optional(),
    startTime: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
  }),
});

export const listNotesSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
  }),
});

export const getNoteSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Note ID is required'),
  }),
});

export const getByStudentSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
  }),
});

export const deleteNoteSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Note ID is required'),
  }),
});
