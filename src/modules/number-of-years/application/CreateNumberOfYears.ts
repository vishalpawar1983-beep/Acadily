import type { UseCase } from '../../../shared/application/UseCase.js';
import type { INumberOfYearsRepository } from '../domain/repositories/INumberOfYearsRepository.js';
import { NumberOfYears } from '../domain/entities/NumberOfYears.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateNumberOfYearsRequest {
  tenantId: string;
  value: number;
  createdBy: string;
}

export interface CreateNumberOfYearsResponse {
  id: string;
  value: number;
}

export class CreateNumberOfYears implements UseCase<CreateNumberOfYearsRequest, CreateNumberOfYearsResponse> {
  constructor(private readonly numberOfYearsRepo: INumberOfYearsRepository) {}

  async execute(request: CreateNumberOfYearsRequest): Promise<CreateNumberOfYearsResponse> {
    const existing = await this.numberOfYearsRepo.findAll(request.tenantId, { limit: 1000 });
    const duplicate = existing.numberOfYears.find(
      (n) => n.value === request.value,
    );
    if (duplicate) {
      throw new ConflictError('Number of years with this value already exists');
    }

    const numberOfYears = NumberOfYears.create({
      tenantId: request.tenantId,
      value: request.value,
      createdBy: request.createdBy,
    });

    const saved = await this.numberOfYearsRepo.save(numberOfYears);

    return {
      id: saved.id,
      value: saved.value,
    };
  }
}
