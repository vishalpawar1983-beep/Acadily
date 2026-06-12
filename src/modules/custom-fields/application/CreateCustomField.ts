import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFieldRepository } from '../domain/repositories/ICustomFieldRepository.js';
import { CustomField } from '../domain/entities/CustomField.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateCustomFieldRequest {
  tenantId: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'email' | 'textarea' | 'radio' | 'url' | 'currency';
  options?: string[];
  mandatory?: boolean;
  defaultValue?: string;
  createdBy: string;
}

export interface CreateCustomFieldResponse {
  id: string;
  fieldName: string;
  fieldType: string;
  options: string[];
  mandatory: boolean;
  defaultValue?: string;
  createdBy: string;
  createdAt: Date;
}

export class CreateCustomField implements UseCase<CreateCustomFieldRequest, CreateCustomFieldResponse> {
  constructor(private readonly repo: ICustomFieldRepository) {}

  async execute(request: CreateCustomFieldRequest): Promise<CreateCustomFieldResponse> {
    const { fields } = await this.repo.findAll(request.tenantId);
    const existing = fields.find((f) => f.fieldName === request.fieldName);
    if (existing) {
      throw new ConflictError(`Custom field with name "${request.fieldName}" already exists`);
    }

    const field = CustomField.create({
      tenantId: request.tenantId,
      fieldName: request.fieldName,
      fieldType: request.fieldType,
      options: request.options,
      mandatory: request.mandatory,
      defaultValue: request.defaultValue,
      createdBy: request.createdBy,
    });

    const saved = await this.repo.save(field);

    return {
      id: saved.id,
      fieldName: saved.fieldName,
      fieldType: saved.fieldType,
      options: saved.options,
      mandatory: saved.mandatory,
      defaultValue: saved.defaultValue,
      createdBy: saved.createdBy,
      createdAt: saved.createdAt,
    };
  }
}
