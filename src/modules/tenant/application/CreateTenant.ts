import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITenantRepository } from '../domain/repositories/ITenantRepository.js';
import { Tenant, type PlanType } from '../domain/entities/Tenant.js';
import { ConflictError, ValidationError } from '../../../shared/domain/errors.js';

export interface CreateTenantRequest {
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  logo?: string;
  config?: {
    receiptPrefix: string;
    gstNumber?: string;
    isGstEnabled: boolean;
    features?: Record<string, boolean>;
  };
  plan?: PlanType;
}

export interface CreateTenantResponse {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  plan: PlanType;
}

export class CreateTenant implements UseCase<CreateTenantRequest, CreateTenantResponse> {
  constructor(private readonly tenantRepo: ITenantRepository) {}

  async execute(request: CreateTenantRequest): Promise<CreateTenantResponse> {
    if (!request.tenantId || !request.slug) {
      throw new ValidationError('tenantId and slug are required');
    }

    const existingBySlug = await this.tenantRepo.findBySlug(request.slug);
    if (existingBySlug) {
      throw new ConflictError(`Tenant with slug "${request.slug}" already exists`);
    }

    const tenant = Tenant.create({
      tenantId: request.tenantId,
      name: request.name,
      slug: request.slug,
      email: request.email,
      phone: request.phone,
      website: request.website,
      address: request.address,
      logo: request.logo,
      config: request.config,
      plan: request.plan,
    });

    const saved = await this.tenantRepo.save(tenant);

    return {
      id: saved.id,
      tenantId: saved.tenantId,
      name: saved.name,
      slug: saved.slug,
      email: saved.email,
      plan: saved.plan,
    };
  }
}
