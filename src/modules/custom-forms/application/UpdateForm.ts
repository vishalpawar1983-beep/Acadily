import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import type { FormField } from '../domain/entities/FormDefinition.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateFormRequest {
  tenantId: string;
  formId: string;
  formName?: string;
  fields?: FormField[];
  isActive?: boolean;
}

export interface UpdateFormResponse {
  id: string;
  formName: string;
  fields: FormField[];
  isActive: boolean;
  updatedAt: Date;
}

export class UpdateForm implements UseCase<UpdateFormRequest, UpdateFormResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: UpdateFormRequest): Promise<UpdateFormResponse> {
    const form = await this.repo.findFormById(request.tenantId, request.formId);
    if (!form) {
      throw new NotFoundError('FormDefinition', request.formId);
    }

    form.updateDetails({
      formName: request.formName,
      fields: request.fields,
      isActive: request.isActive,
    });

    const updated = await this.repo.updateForm(form);

    return {
      id: updated.id,
      formName: updated.formName,
      fields: updated.fields,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }
}
