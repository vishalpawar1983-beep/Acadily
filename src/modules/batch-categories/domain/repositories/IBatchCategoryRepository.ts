import type { BatchCategory } from '../entities/BatchCategory.js';

export interface FindAllOptions {
  skip?: number;
  limit?: number;
}

export interface IBatchCategoryRepository {
  findById(tenantId: string, id: string): Promise<BatchCategory | null>;
  findByName(tenantId: string, categoryName: string): Promise<BatchCategory | null>;
  findAll(
    tenantId: string,
    options?: FindAllOptions,
  ): Promise<{ categories: BatchCategory[]; total: number }>;
  save(category: BatchCategory): Promise<BatchCategory>;
  update(category: BatchCategory): Promise<BatchCategory>;
  delete(tenantId: string, id: string): Promise<void>;
}
