import type { Lab } from '../entities/Lab.js';

export interface FindAllOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ILabRepository {
  findById(tenantId: string, id: string): Promise<Lab | null>;
  findAll(
    tenantId: string,
    options?: FindAllOptions,
  ): Promise<{ labs: Lab[]; total: number }>;
  save(lab: Lab): Promise<Lab>;
  update(lab: Lab): Promise<Lab>;
  delete(tenantId: string, id: string): Promise<void>;
}
