import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITenantRepository } from '../domain/repositories/ITenantRepository.js';
import type { PlanType } from '../domain/entities/Tenant.js';

export interface ListTenantsRequest {
  page?: number;
  limit?: number;
}

export interface ListTenantsResponse {
  tenants: Array<{
    id: string;
    tenantId: string;
    name: string;
    slug: string;
    email: string;
    isActive: boolean;
    plan: PlanType;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}

export class ListTenants implements UseCase<ListTenantsRequest, ListTenantsResponse> {
  constructor(private readonly tenantRepo: ITenantRepository) {}

  async execute(request: ListTenantsRequest): Promise<ListTenantsResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;
    const skip = (page - 1) * limit;

    const { tenants, total } = await this.tenantRepo.findAll({ skip, limit });

    return {
      tenants: tenants.map((t) => ({
        id: t.id,
        tenantId: t.tenantId,
        name: t.name,
        slug: t.slug,
        email: t.email,
        isActive: t.isActive,
        plan: t.plan,
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
