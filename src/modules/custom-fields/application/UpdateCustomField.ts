import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFieldRepository } from '../domain/repositories/ICustomFieldRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateCustomFieldRequest {
  tenantId: string;
  fieldId: string;
  fieldName?: string;
  fieldType?: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'email' | 'textarea' | 'radio' | 'url' | 'currency';
  options?: string[];
  mandatory?: boolean;
  defaultValue?: string;
}

export interface UpdateCustomFieldResponse {
  id: string;
  fieldName: string;
  fieldType: string;
  options: string[];
  mandatory: boolean;
  defaultValue?: string;
  updatedAt: Date;
}

export class UpdateCustomField implements UseCase<UpdateCustomFieldRequest, UpdateCustomFieldResponse> {
  constructor(private readonly repo: ICustomFieldRepository) {}

  async execute(request: UpdateCustomFieldRequest): Promise<UpdateCustomFieldResponse> {
    const field = await this.repo.findById(request.tenantId, request.fieldId);
    if (!field) {
      throw new NotFoundError('CustomField', request.fieldId);
    }

    field.updateDetails({
      fieldName: request.fieldName,
      fieldType: request.fieldType,
      options: request.options,
      mandatory: request.mandatory,
      defaultValue: request.defaultValue,
    });

    const updated = await this.repo.update(field);

    return {
      id: updated.id,
      fieldName: updated.fieldName,
      fieldType: updated.fieldType,
      options: updated.options,
      mandatory: updated.mandatory,
      defaultValue: updated.defaultValue,
      updatedAt: updated.updatedAt,
    };
  }
}
