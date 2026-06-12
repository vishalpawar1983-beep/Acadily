import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IRollNumberRepository } from '../domain/repositories/IRollNumberRepository.js';

export interface GetNextRollNumberRequest {
  tenantId: string;
}

export interface GetNextRollNumberResponse {
  rollNumber: string;
}

export class GetNextRollNumber implements UseCase<GetNextRollNumberRequest, GetNextRollNumberResponse> {
  constructor(private readonly repo: IRollNumberRepository) {}

  async execute(request: GetNextRollNumberRequest): Promise<GetNextRollNumberResponse> {
    const rollNumber = await this.repo.incrementAndGet(request.tenantId);

    return { rollNumber };
  }
}
