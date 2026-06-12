import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import { FormDefinition, type FormField } from '../domain/entities/FormDefinition.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateFormRequest {
  tenantId: string;
  formName: string;
  fields: FormField[];
  isActive?: boolean;
}

export interface CreateFormResponse {
  id: string;
  formName: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: Date;
}

export class CreateForm implements UseCase<CreateFormRequest, CreateFormResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: CreateFormRequest): Promise<CreateFormResponse> {
    const { forms } = await this.repo.findAllForms(request.tenantId, { isActive: undefined });
    const existing = forms.find((f) => f.formName === request.formName);
    if (existing) {
      throw new ConflictError(`Form with name "${request.formName}" already exists`);
    }

    const form = FormDefinition.create({
      tenantId: request.tenantId,
      formName: request.formName,
      fields: request.fields,
      isActive: request.isActive,
    });

    const saved = await this.repo.saveForm(form);

    return {
      id: saved.id,
      formName: saved.formName,
      fields: saved.fields,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
