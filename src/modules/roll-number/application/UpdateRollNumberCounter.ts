import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IRollNumberRepository } from '../domain/repositories/IRollNumberRepository.js';
import { RollNumberCounter } from '../domain/entities/RollNumberCounter.js';

export interface UpdateRollNumberCounterRequest {
  tenantId: string;
  prefix?: string;
  currentValue?: number;
}

export interface UpdateRollNumberCounterResponse {
  id: string;
  prefix: string;
  currentValue: number;
  updatedAt: Date;
}

export class UpdateRollNumberCounter
  implements UseCase<UpdateRollNumberCounterRequest, UpdateRollNumberCounterResponse>
{
  constructor(private readonly repo: IRollNumberRepository) {}

  async execute(
    request: UpdateRollNumberCounterRequest,
  ): Promise<UpdateRollNumberCounterResponse> {
    let counter = await this.repo.findByTenant(request.tenantId);

    if (counter) {
      counter.updateDetails({
        prefix: request.prefix,
        currentValue: request.currentValue,
      });
      counter = await this.repo.update(counter);
    } else {
      const newCounter = RollNumberCounter.create({
        tenantId: request.tenantId,
        prefix: request.prefix,
        currentValue: request.currentValue,
      });
      counter = await this.repo.save(newCounter);
    }

    return {
      id: counter.id,
      prefix: counter.prefix,
      currentValue: counter.currentValue,
      updatedAt: counter.updatedAt,
    };
  }
}
