import { z } from 'zod';

export const submitAdmissionFormSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    formData: z.record(z.unknown()).default({}),
    companyId: z.string().min(1, 'Company ID is required'),
  }),
});

export const getAdmissionFormSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
});
