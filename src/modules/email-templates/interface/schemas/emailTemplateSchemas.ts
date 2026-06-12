import { z } from 'zod';

export const createTemplateSchema = z.object({
  body: z.object({
    templateName: z.string().min(1, 'Template name is required').max(100),
    subject: z.string().min(1, 'Subject is required').max(500),
    body: z.string().min(1, 'Body is required'),
    isActive: z.boolean().optional(),
  }),
});

export const updateTemplateSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Template ID is required'),
  }),
  body: z.object({
    templateName: z.string().min(1).max(100).optional(),
    subject: z.string().min(1).max(500).optional(),
    body: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listTemplatesSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const getTemplateSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Template ID is required'),
  }),
});

export const deleteTemplateSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Template ID is required'),
  }),
});

export const sendTemplatedEmailSchema = z.object({
  body: z.object({
    templateName: z.string().min(1, 'Template name is required').max(100),
    to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
    variables: z.record(z.string(), z.unknown()).optional().default({}),
  }),
});
