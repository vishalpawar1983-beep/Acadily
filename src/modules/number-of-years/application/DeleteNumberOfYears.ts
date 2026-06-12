import type { UseCase } from '../../../shared/application/UseCase.js';
import type { INumberOfYearsRepository } from '../domain/repositories/INumberOfYearsRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteNumberOfYearsRequest {
  tenantId: string;
  numberOfYearsId: string;
}

export interface DeleteNumberOfYearsResponse {
  message: string;
}

export class DeleteNumberOfYears implements UseCase<DeleteNumberOfYearsRequest, DeleteNumberOfYearsResponse> {
  constructor(private readonly numberOfYearsRepo: INumberOfYearsRepository) {}

  async execute(request: DeleteNumberOfYearsRequest): Promise<DeleteNumberOfYearsResponse> {
    const numberOfYears = await this.numberOfYearsRepo.findById(request.tenantId, request.numberOfYearsId);
    if (!numberOfYears) {
      throw new NotFoundError('NumberOfYears', request.numberOfYearsId);
    }

    await this.numberOfYearsRepo.delete(request.tenantId, request.numberOfYearsId);

    return { message: 'Number of years deleted successfully' };
  }
}
