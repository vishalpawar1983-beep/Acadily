import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFieldRepository } from '../domain/repositories/ICustomFieldRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetCustomFieldRequest {
  tenantId: string;
  fieldId: string;
}

export interface GetCustomFieldResponse {
  id: string;
  fieldName: string;
  fieldType: string;
  options: string[];
  mandatory: boolean;
  defaultValue?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetCustomField implements UseCase<GetCustomFieldRequest, GetCustomFieldResponse> {
  constructor(private readonly repo: ICustomFieldRepository) {}

  async execute(request: GetCustomFieldRequest): Promise<GetCustomFieldResponse> {
    const field = await this.repo.findById(request.tenantId, request.fieldId);
    if (!field) {
      throw new NotFoundError('CustomField', request.fieldId);
    }

    return {
      id: field.id,
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      options: field.options,
      mandatory: field.mandatory,
      defaultValue: field.defaultValue,
      createdBy: field.createdBy,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    };
  }
}
