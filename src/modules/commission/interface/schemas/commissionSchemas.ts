import { z } from 'zod';

export const createCommissionSchema = z.object({
  body: z.object({
    studentName: z.string().min(1, 'Student name is required').max(200),
    commissionPersonName: z.string().min(1, 'Commission person name is required').max(200),
    voucherNumber: z.string().max(100).optional(),
    commissionAmount: z.number().min(0, 'Commission amount must be >= 0'),
    commissionPaid: z.number().min(0, 'Commission paid must be >= 0'),
    commissionDate: z.string().min(1, 'Commission date is required'),
    narration: z.string().max(500).optional(),
  }),
});

export const updateCommissionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Commission ID is required'),
  }),
  body: z.object({
    studentName: z.string().min(1).max(200).optional(),
    commissionPersonName: z.string().min(1).max(200).optional(),
    voucherNumber: z.string().max(100).optional(),
    commissionAmount: z.number().min(0).optional(),
    commissionPaid: z.number().min(0).optional(),
    commissionDate: z.string().optional(),
    narration: z.string().max(500).optional(),
  }),
});

export const listCommissionsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
  }),
});

export const getCommissionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Commission ID is required'),
  }),
});

export const deleteCommissionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Commission ID is required'),
  }),
});
