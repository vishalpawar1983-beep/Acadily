import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFieldRepository } from '../domain/repositories/ICustomFieldRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteCustomFieldRequest {
  tenantId: string;
  fieldId: string;
}

export interface DeleteCustomFieldResponse {
  success: boolean;
}

export class DeleteCustomField implements UseCase<DeleteCustomFieldRequest, DeleteCustomFieldResponse> {
  constructor(private readonly repo: ICustomFieldRepository) {}

  async execute(request: DeleteCustomFieldRequest): Promise<DeleteCustomFieldResponse> {
    const field = await this.repo.findById(request.tenantId, request.fieldId);
    if (!field) {
      throw new NotFoundError('CustomField', request.fieldId);
    }

    await this.repo.delete(request.tenantId, request.fieldId);

    return { success: true };
  }
}
