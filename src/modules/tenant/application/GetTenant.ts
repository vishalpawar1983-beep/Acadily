import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITenantRepository } from '../domain/repositories/ITenantRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { PlanType } from '../domain/entities/Tenant.js';

export interface GetTenantRequest {
  slug?: string;
  id?: string;
}

export interface GetTenantResponse {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  logo?: string;
  config: {
    receiptPrefix: string;
    gstNumber?: string;
    isGstEnabled: boolean;
    features: Record<string, boolean>;
  };
  isActive: boolean;
  plan: PlanType;
  createdAt: Date;
  updatedAt: Date;
}

export class GetTenant implements UseCase<GetTenantRequest, GetTenantResponse> {
  constructor(private readonly tenantRepo: ITenantRepository) {}

  async execute(request: GetTenantRequest): Promise<GetTenantResponse> {
    const tenant = request.slug
      ? await this.tenantRepo.findBySlug(request.slug)
      : request.id
        ? await this.tenantRepo.findById(request.id)
        : null;

    if (!tenant) {
      throw new NotFoundError('Tenant', request.slug ?? request.id ?? 'unknown');
    }

    return {
      id: tenant.id,
      tenantId: tenant.tenantId,
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone,
      website: tenant.website,
      address: tenant.address,
      logo: tenant.logo,
      config: {
        receiptPrefix: tenant.config.receiptPrefix,
        gstNumber: tenant.config.gstNumber,
        isGstEnabled: tenant.config.isGstEnabled,
        features: tenant.config.features,
      },
      isActive: tenant.isActive,
      plan: tenant.plan,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
