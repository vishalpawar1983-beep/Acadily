import { z } from 'zod';

// ── Account schemas ─────────────────────────────────────────

export const createAccountSchema = z.object({
  body: z.object({
    accountName: z.string().min(1, 'Account name is required').max(200),
    accountId: z.string().max(50).optional(),
    accountType: z.string().min(1, 'Account type is required').max(50),
    isActive: z.boolean().optional(),
  }),
});

export const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Account ID is required'),
  }),
  body: z.object({
    accountName: z.string().min(1).max(200).optional(),
    accountId: z.string().max(50).optional(),
    accountType: z.string().min(1).max(50).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listAccountsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
  }),
});

export const getAccountSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Account ID is required'),
  }),
});

export const deleteAccountSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Account ID is required'),
  }),
});

// ── Entry schemas ───────────────────────────────────────────

export const createEntrySchema = z.object({
  body: z
    .object({
      // canonical name
      accountId: z.string().optional(),
      // frontend alias
      dayBookAccountId: z.string().optional(),
      // canonical name
      date: z.string().optional(),
      // frontend alias
      dayBookDatadate: z.string().optional(),
      // canonical name
      narration: z.string().optional().default(''),
      // frontend alias (typo in frontend)
      naretion: z.string().optional(),
      debit: z.coerce.number().min(0).optional(),
      credit: z.coerce.number().min(0).optional(),
      balance: z.coerce.number().optional(),
      companyId: z.string().optional(),
      accountName: z.string().optional(),
      accountType: z.string().optional(),
      studentId: z.string().optional(),
      studentName: z.string().optional(),
      rollNumber: z.string().optional(),
      receiptNumber: z.string().optional(),
      linkAccountId: z.string().optional(),
      linkAccountType: z.string().optional(),
      linkAccountName: z.string().optional(),
      linkDayBookAccountData: z.string().optional(),
    })
    .transform((data) => ({
      accountId: data.accountId ?? data.dayBookAccountId ?? '',
      date: data.date ?? data.dayBookDatadate,
      narration: data.narration || data.naretion || '',
      debit: data.debit,
      credit: data.credit,
      balance: data.balance,
      companyId: data.companyId,
      accountName: data.accountName,
      accountType: data.accountType,
      studentId: data.studentId,
      studentName: data.studentName,
      rollNumber: data.rollNumber,
      receiptNumber: data.receiptNumber,
      linkAccountId: data.linkAccountId,
      linkAccountType: data.linkAccountType,
      linkAccountName: data.linkAccountName,
      linkDayBookAccountData: data.linkDayBookAccountData,
    }))
    .refine((data) => data.accountId.length > 0, {
      message: 'Account ID is required',
      path: ['accountId'],
    }),
});

export const updateEntrySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Entry ID is required'),
  }),
  body: z
    .object({
      accountId: z.string().optional(),
      dayBookAccountId: z.string().optional(),
      date: z.string().optional(),
      dayBookDatadate: z.string().optional(),
      narration: z.string().optional(),
      naretion: z.string().optional(),
      debit: z.coerce.number().min(0).optional(),
      credit: z.coerce.number().min(0).optional(),
      balance: z.coerce.number().optional(),
      companyId: z.string().optional(),
      accountName: z.string().optional(),
      accountType: z.string().optional(),
      studentId: z.string().optional(),
      studentName: z.string().optional(),
      rollNumber: z.string().optional(),
      receiptNumber: z.string().optional(),
      linkAccountId: z.string().optional(),
      linkAccountType: z.string().optional(),
      linkAccountName: z.string().optional(),
      linkDayBookAccountData: z.string().optional(),
    })
    .transform((data) => ({
      accountId: data.accountId ?? data.dayBookAccountId,
      accountName: data.accountName,
      accountType: data.accountType,
      date: data.date ?? data.dayBookDatadate,
      narration: data.narration ?? data.naretion,
      debit: data.debit,
      credit: data.credit,
      balance: data.balance,
      companyId: data.companyId,
      studentId: data.studentId,
      studentName: data.studentName,
      rollNumber: data.rollNumber,
      receiptNumber: data.receiptNumber,
      linkAccountId: data.linkAccountId,
      linkAccountName: data.linkAccountName,
      linkAccountType: data.linkAccountType,
      linkDayBookAccountData: data.linkDayBookAccountData,
    })),
});

export const listEntriesSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    accountId: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const getEntrySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Entry ID is required'),
  }),
});

export const deleteEntrySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Entry ID is required'),
  }),
});
