import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IRollNumberRepository } from '../domain/repositories/IRollNumberRepository.js';

export interface GetRollNumberCounterRequest {
  tenantId: string;
}

export interface GetRollNumberCounterResponse {
  id: string;
  prefix: string;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GetRollNumberCounter
  implements UseCase<GetRollNumberCounterRequest, GetRollNumberCounterResponse | null>
{
  constructor(private readonly repo: IRollNumberRepository) {}

  async execute(
    request: GetRollNumberCounterRequest,
  ): Promise<GetRollNumberCounterResponse | null> {
    const counter = await this.repo.findByTenant(request.tenantId);
    if (!counter) {
      return null;
    }

    return {
      id: counter.id,
      prefix: counter.prefix,
      currentValue: counter.currentValue,
      createdAt: counter.createdAt,
      updatedAt: counter.updatedAt,
    };
  }
}
