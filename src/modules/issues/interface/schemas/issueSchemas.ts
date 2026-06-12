import { z } from 'zod';

export const createIssueSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    date: z.string().optional(),
    particulars: z.string().min(1, 'Particulars is required').max(2000),
    addedBy: z.string().min(1, 'AddedBy is required'),
    showOnDashboard: z.boolean().optional(),
    status: z.enum(['open', 'inProgress', 'resolved', 'closed']).optional(),
  }),
});

export const updateIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Issue ID is required'),
  }),
  body: z.object({
    particulars: z.string().min(1).max(2000).optional(),
    date: z.string().optional(),
    showOnDashboard: z.boolean().optional(),
    status: z.enum(['open', 'inProgress', 'resolved', 'closed']).optional(),
  }),
});

export const listIssuesSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(['open', 'inProgress', 'resolved', 'closed']).optional(),
    search: z.string().optional(),
  }),
});

export const getIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Issue ID is required'),
  }),
});

export const getByStudentSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(['open', 'inProgress', 'resolved', 'closed']).optional(),
    search: z.string().optional(),
  }),
});

export const deleteIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Issue ID is required'),
  }),
});

export const updateIssueStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Issue ID is required'),
  }),
  body: z.object({
    showNotesDashBoard: z.boolean(),
  }),
});

// ── Dashboard schemas ──────────────────────────────────────

export const toggleDashboardSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    showStudent: z.boolean(),
  }),
});

export const getDashboardByStudentSchema = z.object({
  params: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
  }),
});
