import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import type { FormField } from '../domain/entities/FormDefinition.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetFormRequest {
  tenantId: string;
  formId: string;
}

export interface GetFormResponse {
  id: string;
  formName: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetForm implements UseCase<GetFormRequest, GetFormResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: GetFormRequest): Promise<GetFormResponse> {
    const form = await this.repo.findFormById(request.tenantId, request.formId);
    if (!form) {
      throw new NotFoundError('FormDefinition', request.formId);
    }

    return {
      id: form.id,
      formName: form.formName,
      fields: form.fields,
      isActive: form.isActive,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  }
}
