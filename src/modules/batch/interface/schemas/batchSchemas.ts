import { z } from 'zod';

const subjectSchema = z.object({
  subjectName: z.string().min(1),
  status: z.enum(['notStarted', 'inProgress', 'completed']).optional(),
  progress: z.number().min(0).max(100).optional(),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  notes: z.string().optional(),
});

const studentSchema = z.object({
  studentId: z.string().min(1),
  subjects: z.array(subjectSchema).optional(),
  currentSoftware: z.string().optional(),
});

export const createBatchSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    courseCategory: z.string().optional(),
    course: z.string().optional(),
    trainer: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    status: z.enum(['completed', 'inProgress']).optional(),
    students: z.array(studentSchema).optional(),
  }),
});

export const updateBatchSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Batch ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    courseCategory: z.string().optional(),
    course: z.string().optional(),
    trainer: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['completed', 'inProgress']).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listBatchesSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
    status: z.enum(['completed', 'inProgress']).optional(),
    search: z.string().optional(),
  }),
});

export const getBatchSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Batch ID is required'),
  }),
});

export const addStudentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Batch ID is required'),
  }),
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    subjects: z.array(subjectSchema).optional(),
    currentSoftware: z.string().optional(),
  }),
});

export const removeStudentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Batch ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
  }),
});

export const deleteBatchSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Batch ID is required'),
  }),
});

export const getStudentProgressSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Batch ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
  }),
});

export const updateSubjectStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Batch ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    subjectId: z.string().min(1, 'Subject ID is required'),
  }),
  body: z.object({
    status: z.enum(['notStarted', 'inProgress', 'completed']).optional(),
    progress: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  }),
});

export const updateBatchStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Batch ID is required'),
  }),
  body: z.object({
    status: z.enum(['completed', 'inProgress']),
  }),
});

export const listBatchesByCompanySchema = z.object({
  params: z.object({
    companyId: z.string().min(1, 'Company ID is required'),
  }),
});

export const listPendingBatchesSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
