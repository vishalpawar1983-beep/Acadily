import { Tenant } from '../entities/Tenant.js';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  findAll(options?: { skip?: number; limit?: number }): Promise<{ tenants: Tenant[]; total: number }>;
  save(tenant: Tenant): Promise<Tenant>;
  update(tenant: Tenant): Promise<Tenant>;
  delete(id: string): Promise<void>;
}
