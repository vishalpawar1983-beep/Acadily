import { z } from 'zod';

export const createApprovalSchema = z.object({
  body: z.object({
    receiptId: z.string().min(1, 'Receipt ID is required'),
    studentId: z.string().min(1, 'Student ID is required'),
    remarks: z.string().optional(),
  }),
});

export const reviewApprovalSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Approval ID is required'),
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected']),
    reviewedBy: z.string().min(1, 'ReviewedBy is required'),
    remarks: z.string().optional(),
  }),
});

export const listApprovalsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});

export const listPendingSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const getApprovalSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Approval ID is required'),
  }),
});

export const getByStudentSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});
