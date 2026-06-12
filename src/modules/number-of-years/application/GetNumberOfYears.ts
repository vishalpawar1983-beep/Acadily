import type { UseCase } from '../../../shared/application/UseCase.js';
import type { INumberOfYearsRepository } from '../domain/repositories/INumberOfYearsRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetNumberOfYearsRequest {
  tenantId: string;
  numberOfYearsId: string;
}

export interface GetNumberOfYearsResponse {
  id: string;
  value: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetNumberOfYears implements UseCase<GetNumberOfYearsRequest, GetNumberOfYearsResponse> {
  constructor(private readonly numberOfYearsRepo: INumberOfYearsRepository) {}

  async execute(request: GetNumberOfYearsRequest): Promise<GetNumberOfYearsResponse> {
    const numberOfYears = await this.numberOfYearsRepo.findById(request.tenantId, request.numberOfYearsId);
    if (!numberOfYears) {
      throw new NotFoundError('NumberOfYears', request.numberOfYearsId);
    }

    return {
      id: numberOfYears.id,
      value: numberOfYears.value,
      createdBy: numberOfYears.createdBy,
      createdAt: numberOfYears.createdAt,
      updatedAt: numberOfYears.updatedAt,
    };
  }
}
