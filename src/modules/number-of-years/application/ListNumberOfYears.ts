import type { UseCase } from '../../../shared/application/UseCase.js';
import type { INumberOfYearsRepository } from '../domain/repositories/INumberOfYearsRepository.js';

export interface ListNumberOfYearsRequest {
  tenantId: string;
  page?: number;
  limit?: number;
}

export interface ListNumberOfYearsResponse {
  numberOfYears: Array<{
    id: string;
    value: number;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}

export class ListNumberOfYears implements UseCase<ListNumberOfYearsRequest, ListNumberOfYearsResponse> {
  constructor(private readonly numberOfYearsRepo: INumberOfYearsRepository) {}

  async execute(request: ListNumberOfYearsRequest): Promise<ListNumberOfYearsResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;
    const skip = (page - 1) * limit;

    const { numberOfYears, total } = await this.numberOfYearsRepo.findAll(request.tenantId, {
      skip,
      limit,
    });

    return {
      numberOfYears: numberOfYears.map((n) => ({
        id: n.id,
        value: n.value,
        createdAt: n.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
