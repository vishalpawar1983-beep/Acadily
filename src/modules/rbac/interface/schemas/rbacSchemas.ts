import { z } from 'zod';

const roleEnum = z.enum(['Student', 'Telecaller', 'Accounts', 'Counsellor', 'Admin', 'SuperAdmin', 'Trainer']);

export const createRoleAccessSchema = z.object({
  body: z.object({
    role: roleEnum,
    permissions: z.record(z.string(), z.boolean()).optional(),
  }),
});

export const updateRoleAccessSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'RoleAccess ID is required'),
  }),
  body: z.object({
    role: roleEnum.optional(),
    permissions: z.record(z.string(), z.boolean()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listRoleAccessSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

export const getRoleAccessSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'RoleAccess ID is required'),
  }),
});

export const getRoleAccessByRoleSchema = z.object({
  params: z.object({
    role: roleEnum,
  }),
});
