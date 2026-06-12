import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';

export interface ListSelectsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
}

export interface ListSelectsResponse {
  selects: Array<{
    id: string;
    selectName: string;
    options: string[];
    mandatory: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListSelects implements UseCase<ListSelectsRequest, ListSelectsResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: ListSelectsRequest): Promise<ListSelectsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { selects, total } = await this.repo.findAllSelects(request.tenantId, { skip, limit });

    return {
      selects: selects.map((s) => ({
        id: s.id,
        selectName: s.selectName,
        options: s.options,
        mandatory: s.mandatory,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
