import { z } from 'zod';

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
  code: z.string().min(1, 'Subject code is required').max(20),
  fullMarks: z.number().int().positive('Full marks must be positive'),
  passMarks: z.number().int().nonnegative('Pass marks must be non-negative'),
  semester: z.number().int().positive('Semester must be positive'),
});

export const createCourseSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Course name is required').max(200),
    fees: z.number().nonnegative('Fees must be non-negative'),
    courseType: z.string().min(1, 'Course type is required').max(50),
    durationYears: z.number().int().positive('Duration must be positive'),
    category: z.string().min(1, 'Category is required').max(100),
    subjects: z.array(subjectSchema).optional(),
  }),
});

export const updateCourseSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Course ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    fees: z.number().nonnegative().optional(),
    courseType: z.string().min(1).max(50).optional(),
    durationYears: z.number().int().positive().optional(),
    category: z.string().min(1).max(100).optional(),
    subjects: z.array(subjectSchema).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCourseSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Course ID is required'),
  }),
});

export const deleteCourseSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Course ID is required'),
  }),
});

export const listCoursesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    category: z.string().optional(),
  }),
});
