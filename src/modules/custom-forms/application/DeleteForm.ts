import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteFormRequest {
  tenantId: string;
  formId: string;
}

export interface DeleteFormResponse {
  success: boolean;
}

export class DeleteForm implements UseCase<DeleteFormRequest, DeleteFormResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: DeleteFormRequest): Promise<DeleteFormResponse> {
    const form = await this.repo.findFormById(request.tenantId, request.formId);
    if (!form) {
      throw new NotFoundError('FormDefinition', request.formId);
    }

    await this.repo.deleteForm(request.tenantId, request.formId);

    return { success: true };
  }
}
