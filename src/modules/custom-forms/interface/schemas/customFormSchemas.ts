import { z } from 'zod';

const formFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum([
    'text',
    'checkbox',
    'radio',
    'select',
    'number',
    'email',
    'date',
    'datetime-local',
    'url',
    'currency',
    'textarea',
  ]),
  options: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  mandatory: z.boolean().default(false),
  headerView: z.boolean().default(false),
});

export const createFormSchema = z.object({
  body: z.object({
    formName: z.string().min(1, 'Form name is required').max(200),
    fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
    isActive: z.boolean().optional(),
  }),
});

export const updateFormSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Form ID is required'),
  }),
  body: z.object({
    formName: z.string().min(1).max(200).optional(),
    fields: z.array(formFieldSchema).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listFormsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const getFormSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Form ID is required'),
  }),
});

export const submitFormSchema = z.object({
  params: z.object({
    formId: z.string().min(1, 'Form ID is required'),
  }),
  body: z.object({
    values: z.array(
      z.object({
        fieldName: z.string().min(1),
        fieldType: z.string().min(1),
        value: z.any(),
      }),
    ),
  }),
});

export const deleteFormSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Form ID is required'),
  }),
});

export const publicSubmitFormSchema = z.object({
  params: z.object({
    formId: z.string().min(1, 'Form ID is required'),
  }),
  body: z.object({
    values: z.array(
      z.object({
        fieldName: z.string().min(1),
        fieldType: z.string().min(1),
        value: z.any(),
      }),
    ),
  }),
});

export const getSubmissionSchema = z.object({
  params: z.object({
    formId: z.string().min(1, 'Form ID is required'),
    id: z.string().min(1, 'Submission ID is required'),
  }),
});

export const updateSubmissionSchema = z.object({
  params: z.object({
    formId: z.string().min(1, 'Form ID is required'),
    id: z.string().min(1, 'Submission ID is required'),
  }),
  body: z.object({
    values: z.array(
      z.object({
        fieldName: z.string().min(1),
        fieldType: z.string().min(1),
        value: z.any(),
      }),
    ).optional(),
  }),
});

export const deleteSubmissionSchema = z.object({
  params: z.object({
    formId: z.string().min(1, 'Form ID is required'),
    id: z.string().min(1, 'Submission ID is required'),
  }),
});

// ── Default Select schemas ──────────────────────────────────

export const createSelectSchema = z.object({
  body: z.object({
    selectName: z.string().min(1, 'Select name is required').max(200),
    options: z.array(z.string()).min(1, 'At least one option is required'),
    mandatory: z.boolean().optional(),
  }),
});

export const updateSelectSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Select ID is required'),
  }),
  body: z.object({
    selectName: z.string().min(1).max(200).optional(),
    options: z.array(z.string()).optional(),
    mandatory: z.boolean().optional(),
  }),
});

export const getSelectSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Select ID is required'),
  }),
});

export const listSelectsSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const listSubmissionsSchema = z.object({
  params: z.object({
    formId: z.string().min(1, 'Form ID is required'),
  }),
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
