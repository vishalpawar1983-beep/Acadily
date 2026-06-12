import { z } from 'zod';

export const createTenantSchema = z.object({
  body: z.object({
    tenantId: z
      .string()
      .min(1, 'tenantId is required')
      .max(50)
      .regex(/^[a-z0-9_]+$/, 'tenantId must be lowercase alphanumeric with underscores'),
    name: z.string().min(1, 'Name is required').max(100),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(50)
      .regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric with hyphens or underscores'),
    email: z.string().email('Invalid email address'),
    phone: z.string().max(20).optional(),
    website: z.string().url('Invalid URL').optional(),
    address: z.string().max(500).optional(),
    logo: z.string().optional(),
    config: z
      .object({
        receiptPrefix: z.string().max(20).default(''),
        gstNumber: z.string().max(20).optional(),
        isGstEnabled: z.boolean().default(false),
        features: z.record(z.string(), z.boolean()).optional(),
      })
      .optional(),
    plan: z.enum(['free', 'basic', 'premium']).optional(),
  }),
});

export const updateTenantSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Tenant ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().max(20).optional(),
    website: z.string().url('Invalid URL').optional(),
    address: z.string().max(500).optional(),
    logo: z.string().optional(),
    config: z
      .object({
        receiptPrefix: z.string().max(20).optional(),
        gstNumber: z.string().max(20).optional(),
        isGstEnabled: z.boolean().optional(),
        features: z.record(z.string(), z.boolean()).optional(),
      })
      .optional(),
    plan: z.enum(['free', 'basic', 'premium']).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getTenantSchema = z.object({
  params: z.object({
    identifier: z.string().min(1, 'Tenant identifier is required'),
  }),
});

export const deleteTenantSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Tenant ID is required'),
  }),
});

export const listTenantsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});
