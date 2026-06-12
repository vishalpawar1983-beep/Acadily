import { z } from 'zod';

export const createCustomFieldSchema = z.object({
  body: z.object({
    fieldName: z.string().min(1, 'Field name is required').max(200),
    fieldType: z.enum([
      'text',
      'number',
      'select',
      'date',
      'checkbox',
      'email',
      'textarea',
      'radio',
      'url',
      'currency',
    ]),
    options: z.array(z.string()).optional(),
    mandatory: z.boolean().optional(),
    defaultValue: z.string().optional(),
  }),
});

export const updateCustomFieldSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Field ID is required'),
  }),
  body: z.object({
    fieldName: z.string().min(1).max(200).optional(),
    fieldType: z
      .enum([
        'text',
        'number',
        'select',
        'date',
        'checkbox',
        'email',
        'textarea',
        'radio',
        'url',
        'currency',
      ])
      .optional(),
    options: z.array(z.string()).optional(),
    mandatory: z.boolean().optional(),
    defaultValue: z.string().optional(),
  }),
});

export const getCustomFieldSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Field ID is required'),
  }),
});

export const deleteCustomFieldSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Field ID is required'),
  }),
});

export const listCustomFieldsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
