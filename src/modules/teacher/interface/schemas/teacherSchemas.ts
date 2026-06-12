import { z } from 'zod';

export const createTeacherSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone is required').max(20),
    subjects: z.array(z.string()).optional(),
    qualification: z.string().min(1, 'Qualification is required').max(200),
    experience: z.number().int().min(0).optional(),
    address: z.string().min(1, 'Address is required').max(500),
    joiningDate: z.string().optional(),
  }),
});

export const updateTeacherSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Teacher ID is required'),
  }),
  body: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().min(1).max(20).optional(),
    subjects: z.array(z.string()).optional(),
    qualification: z.string().min(1).max(200).optional(),
    experience: z.number().int().min(0).optional(),
    address: z.string().min(1).max(500).optional(),
    isActive: z.boolean().optional(),
    joiningDate: z.string().optional(),
  }),
});

export const listTeachersSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
  }),
});

export const getTeacherSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Teacher ID is required'),
  }),
});

export const deleteTeacherSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Teacher ID is required'),
  }),
});
