import { z } from 'zod';

export const createSubjectSchema = z.object({
  body: z.object({
    subjectName: z.string().min(1, 'Subject name is required'),
    subjectCode: z.string().min(1, 'Subject code is required'),
    fullMarks: z.number().min(0, 'Full marks must be non-negative'),
    passMarks: z.number().min(0, 'Pass marks must be non-negative'),
    semYear: z.string().min(1, 'Semester/Year is required'),
    courseId: z.string().min(1, 'Course ID is required').optional(),
  }),
});

export const updateSubjectSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Subject ID is required'),
  }),
  body: z.object({
    subjectName: z.string().min(1).optional(),
    subjectCode: z.string().min(1).optional(),
    fullMarks: z.number().min(0).optional(),
    passMarks: z.number().min(0).optional(),
    semYear: z.string().min(1).optional(),
    courseId: z.string().min(1).optional(),
  }),
});

export const getSubjectSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Subject ID is required'),
  }),
});

export const listSubjectsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    courseId: z.string().optional(),
  }),
});

export const getSubjectsByCourseSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required'),
  }),
});

export const deleteSubjectSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Subject ID is required'),
  }),
});
