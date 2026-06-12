import { Category } from '../entities/Category.js';

export interface ICategoryRepository {
  findById(tenantId: string, id: string): Promise<Category | null>;
  findAll(
    tenantId: string,
    options?: { skip?: number; limit?: number },
  ): Promise<{ categories: Category[]; total: number }>;
  save(category: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
  delete(tenantId: string, id: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}
