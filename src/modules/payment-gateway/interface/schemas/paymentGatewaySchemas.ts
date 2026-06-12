import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  body: z.object({
    studentId: z.string().min(1),
    amount: z.number().positive(),
    courseName: z.string().min(1),
    studentName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    courseId: z.string().min(1),
    lateFees: z.number().min(0).optional(),
    remainingFees: z.number().min(0).optional(),
    installmentCount: z.number().int().min(0).optional(),
    installmentAmount: z.number().min(0).optional(),
    netCourseFees: z.number().min(0).optional(),
    paymentOption: z.string().optional(),
  }),
});

export const paymentCallbackSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1),
    transactionId: z.string().min(1),
    gatewayResponse: z.record(z.unknown()).optional(),
  }),
});

export const listPaymentTransactionsSchema = z.object({
  query: z.object({
    skip: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['pending', 'success', 'failure']).optional(),
    studentId: z.string().optional(),
  }),
});

export const getPaymentTransactionSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
