import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITenantRepository } from '../domain/repositories/ITenantRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { PlanType } from '../domain/entities/Tenant.js';

export interface UpdateTenantRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  logo?: string;
  config?: {
    receiptPrefix?: string;
    gstNumber?: string;
    isGstEnabled?: boolean;
    features?: Record<string, boolean>;
  };
  plan?: PlanType;
  isActive?: boolean;
}

export interface UpdateTenantResponse {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  plan: PlanType;
  isActive: boolean;
}

export class UpdateTenant implements UseCase<UpdateTenantRequest, UpdateTenantResponse> {
  constructor(private readonly tenantRepo: ITenantRepository) {}

  async execute(request: UpdateTenantRequest): Promise<UpdateTenantResponse> {
    const tenant = await this.tenantRepo.findById(request.id);
    if (!tenant) {
      throw new NotFoundError('Tenant', request.id);
    }

    tenant.updateDetails({
      name: request.name,
      email: request.email,
      phone: request.phone,
      website: request.website,
      address: request.address,
      logo: request.logo,
    });

    if (request.config) {
      tenant.updateConfig(request.config);
    }

    if (request.plan) {
      tenant.updatePlan(request.plan);
    }

    if (request.isActive === false) {
      tenant.deactivate();
    } else if (request.isActive === true) {
      tenant.activate();
    }

    const updated = await this.tenantRepo.update(tenant);

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      name: updated.name,
      slug: updated.slug,
      email: updated.email,
      plan: updated.plan,
      isActive: updated.isActive,
    };
  }
}
