import type { CustomField } from '../entities/CustomField.js';

export interface FindAllCustomFieldsOptions {
  skip?: number;
  limit?: number;
}

export interface ICustomFieldRepository {
  findById(tenantId: string, id: string): Promise<CustomField | null>;
  findAll(
    tenantId: string,
    options?: FindAllCustomFieldsOptions,
  ): Promise<{ fields: CustomField[]; total: number }>;
  save(field: CustomField): Promise<CustomField>;
  update(field: CustomField): Promise<CustomField>;
  delete(tenantId: string, id: string): Promise<void>;
}
