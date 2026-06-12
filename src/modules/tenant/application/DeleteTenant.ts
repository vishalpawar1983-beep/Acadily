import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITenantRepository } from '../domain/repositories/ITenantRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteTenantRequest {
  id: string;
}

export interface DeleteTenantResponse {
  success: boolean;
}

export class DeleteTenant implements UseCase<DeleteTenantRequest, DeleteTenantResponse> {
  constructor(private readonly tenantRepo: ITenantRepository) {}

  async execute(request: DeleteTenantRequest): Promise<DeleteTenantResponse> {
    const tenant = await this.tenantRepo.findById(request.id);
    if (!tenant) {
      throw new NotFoundError('Tenant', request.id);
    }

    await this.tenantRepo.delete(request.id);

    return { success: true };
  }
}
