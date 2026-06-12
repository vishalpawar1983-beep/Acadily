import { z } from 'zod';

const subjectMarkSchema = z.object({
  subjectName: z.string().min(1),
  subjectCode: z.string().min(1),
  theory: z.number().nullable().optional().default(null),
  practical: z.number().nullable().optional().default(null),
  totalMarks: z.number().nullable().optional().default(null),
  isActive: z.boolean().optional().default(true),
});

export const recordMarksSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
    subjects: z.array(subjectMarkSchema).optional(),
    resultStatus: z.enum(['NotStarted', 'InProgress', 'Completed']).optional(),
  }),
});

export const updateMarksSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Marks ID is required'),
  }),
  body: z.object({
    subjects: z.array(subjectMarkSchema).optional(),
    resultStatus: z.enum(['NotStarted', 'InProgress', 'Completed']).optional(),
  }),
});

export const listMarksSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    studentId: z.string().optional(),
    courseId: z.string().optional(),
    resultStatus: z.enum(['NotStarted', 'InProgress', 'Completed']).optional(),
  }),
});

export const getMarksSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Marks ID is required'),
  }),
});

export const getStudentMarksSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
});

export const assignSubjectsSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
    subjectIds: z.array(
      z.object({
        subjectName: z.string().min(1),
        subjectCode: z.string().min(1),
      }),
    ).min(1, 'At least one subject is required'),
  }),
});

export const bulkUpdateMarksSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
    subjects: z.array(
      z.object({
        subjectId: z.string().min(1),
        theory: z.number().nullable(),
        practical: z.number().nullable(),
      }),
    ).min(1, 'At least one subject is required'),
  }),
});

export const getStudentCourseMarksSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
  }),
});
