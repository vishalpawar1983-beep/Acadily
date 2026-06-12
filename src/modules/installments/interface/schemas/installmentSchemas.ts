import { z } from 'zod';

export const createInstallmentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
    installmentNumber: z.number().int().min(1, 'Installment number is required'),
    installmentAmount: z.number().min(0, 'Installment amount is required'),
    dueDate: z.string().min(1, 'Due date is required'),
  }),
});

export const listInstallmentsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    studentId: z.string().optional(),
    courseId: z.string().optional(),
    isPaid: z.coerce.boolean().optional(),
  }),
});

export const getInstallmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Installment ID is required'),
  }),
});

export const getStudentInstallmentsSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
});

export const markPaidSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Installment ID is required'),
  }),
  body: z.object({
    paidDate: z.string().optional(),
  }),
});

export const updateInstallmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Installment ID is required'),
  }),
  body: z.object({
    installmentAmount: z.number().min(0).optional(),
    dueDate: z.string().optional(),
  }),
});

export const listInstallmentsByCompanySchema = z.object({
  params: z.object({
    companyId: z.string().min(1, 'Company ID is required'),
  }),
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const calculateLateFeesSchema = z.object({
  body: z.object({
    lateFeeAmount: z.number().min(0, 'Late fee amount must be non-negative'),
    frequency: z.enum(['daily', 'monthly']),
  }),
});
