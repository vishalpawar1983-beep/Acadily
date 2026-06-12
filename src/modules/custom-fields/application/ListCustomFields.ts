import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFieldRepository } from '../domain/repositories/ICustomFieldRepository.js';

export interface ListCustomFieldsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
}

export interface ListCustomFieldsResponse {
  fields: Array<{
    id: string;
    fieldName: string;
    fieldType: string;
    options: string[];
    mandatory: boolean;
    defaultValue?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListCustomFields implements UseCase<ListCustomFieldsRequest, ListCustomFieldsResponse> {
  constructor(private readonly repo: ICustomFieldRepository) {}

  async execute(request: ListCustomFieldsRequest): Promise<ListCustomFieldsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { fields, total } = await this.repo.findAll(request.tenantId, { skip, limit });

    return {
      fields: fields.map((f) => ({
        id: f.id,
        fieldName: f.fieldName,
        fieldType: f.fieldType,
        options: f.options,
        mandatory: f.mandatory,
        defaultValue: f.defaultValue,
        createdBy: f.createdBy,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
