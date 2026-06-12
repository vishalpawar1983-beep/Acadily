import { z } from 'zod';

const layoutItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().min(0),
});

export const saveColumnsSchema = z.object({
  body: z.object({
    formId: z.string().min(1, 'Form ID is required'),
    columns: z.array(layoutItemSchema).min(1, 'At least one column is required'),
  }),
});

export const getColumnsSchema = z.object({
  query: z.object({
    formId: z.string().min(1, 'Form ID is required').optional(),
  }),
});

export const deleteColumnSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Column layout ID is required'),
  }),
});

export const saveRowsSchema = z.object({
  body: z.object({
    formId: z.string().min(1, 'Form ID is required'),
    rows: z.array(layoutItemSchema).min(1, 'At least one row is required'),
  }),
});

export const getRowsSchema = z.object({
  query: z.object({
    formId: z.string().min(1, 'Form ID is required').optional(),
  }),
});

export const deleteRowSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Row layout ID is required'),
  }),
});
