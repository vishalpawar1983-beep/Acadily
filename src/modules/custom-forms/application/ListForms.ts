import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import type { FormField } from '../domain/entities/FormDefinition.js';

export interface ListFormsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ListFormsResponse {
  forms: Array<{
    id: string;
    formName: string;
    fields: FormField[];
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListForms implements UseCase<ListFormsRequest, ListFormsResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: ListFormsRequest): Promise<ListFormsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { forms, total } = await this.repo.findAllForms(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
    });

    return {
      forms: forms.map((f) => ({
        id: f.id,
        formName: f.formName,
        fields: f.fields,
        isActive: f.isActive,
        createdAt: f.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
