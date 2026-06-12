import type { Commission } from '../entities/Commission.js';

export interface FindAllOptions {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface ICommissionRepository {
  findById(tenantId: string, id: string): Promise<Commission | null>;
  findAll(
    tenantId: string,
    options?: FindAllOptions,
  ): Promise<{ commissions: Commission[]; total: number }>;
  save(commission: Commission): Promise<Commission>;
  update(commission: Commission): Promise<Commission>;
  delete(tenantId: string, id: string): Promise<void>;
}
