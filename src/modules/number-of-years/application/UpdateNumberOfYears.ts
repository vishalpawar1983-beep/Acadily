import type { UseCase } from '../../../shared/application/UseCase.js';
import type { INumberOfYearsRepository } from '../domain/repositories/INumberOfYearsRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateNumberOfYearsRequest {
  tenantId: string;
  numberOfYearsId: string;
  value?: number;
}

export interface UpdateNumberOfYearsResponse {
  id: string;
  value: number;
  updatedAt: Date;
}

export class UpdateNumberOfYears implements UseCase<UpdateNumberOfYearsRequest, UpdateNumberOfYearsResponse> {
  constructor(private readonly numberOfYearsRepo: INumberOfYearsRepository) {}

  async execute(request: UpdateNumberOfYearsRequest): Promise<UpdateNumberOfYearsResponse> {
    const numberOfYears = await this.numberOfYearsRepo.findById(request.tenantId, request.numberOfYearsId);
    if (!numberOfYears) {
      throw new NotFoundError('NumberOfYears', request.numberOfYearsId);
    }

    numberOfYears.updateDetails({
      value: request.value,
    });

    const updated = await this.numberOfYearsRepo.update(numberOfYears);

    return {
      id: updated.id,
      value: updated.value,
      updatedAt: updated.updatedAt,
    };
  }
}
