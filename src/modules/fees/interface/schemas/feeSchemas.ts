import { z } from 'zod';

export const recordPaymentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
    netCourseFees: z.number().nonnegative('Net course fees must be non-negative'),
    remainingFees: z.number().nonnegative('Remaining fees must be non-negative'),
    amountPaid: z.number().positive('Amount paid must be positive'),
    receiptNumber: z.string().min(1, 'Receipt number is required').max(50),
    paymentMethod: z.string().min(1, 'Payment method is required').max(50),
    narration: z.string().max(500).optional(),
    lateFees: z.number().nonnegative().optional(),
    gstPercentage: z.number().nonnegative('GST percentage must be non-negative'),
    paymentDate: z.string().datetime().optional(),
  }),
});

export const listFeesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    studentId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const getStudentFeesSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
});

export const getFeePaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Fee payment ID is required'),
  }),
});

export const updateFeePaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Fee payment ID is required'),
  }),
  body: z.object({
    amountPaid: z.number().positive('Amount paid must be positive').optional(),
    narration: z.string().max(500).optional(),
    amountDate: z.string().optional(),
    lateFees: z.number().nonnegative().optional(),
    receiptNumber: z.string().min(1).max(50).optional(),
  }),
});

export const deleteFeePaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Fee payment ID is required'),
  }),
});

export const getNotPaidStudentsSchema = z.object({
  body: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    companyId: z.string().optional(),
  }),
});
