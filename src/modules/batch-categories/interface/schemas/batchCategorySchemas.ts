import { z } from 'zod';

export const createBatchCategorySchema = z.object({
  body: z.object({
    categoryName: z.string().min(1, 'Category name is required').max(200),
  }),
});

export const listBatchCategoriesSchema = z.object({
  query: z.object({
    skip: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const getBatchCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required'),
  }),
});

export const updateBatchCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required'),
  }),
  body: z.object({
    categoryName: z.string().min(1, 'Category name is required').max(200),
  }),
});

export const deleteBatchCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required'),
  }),
});
