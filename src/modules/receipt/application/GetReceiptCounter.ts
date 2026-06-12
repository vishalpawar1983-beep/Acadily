import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IReceiptCounterRepository } from '../domain/repositories/IReceiptCounterRepository.js';
import { ReceiptCounter } from '../domain/entities/ReceiptCounter.js';

export interface GetReceiptCounterRequest {
  tenantId: string;
}

export interface GetReceiptCounterResponse {
  id: string;
  tenantId: string;
  prefix: string;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export class GetReceiptCounter implements UseCase<GetReceiptCounterRequest, GetReceiptCounterResponse> {
  constructor(private readonly counterRepo: IReceiptCounterRepository) {}

  async execute(request: GetReceiptCounterRequest): Promise<GetReceiptCounterResponse> {
    let counter = await this.counterRepo.findByTenant(request.tenantId);
    if (!counter) {
      counter = ReceiptCounter.create({ tenantId: request.tenantId, prefix: 'RCP' });
      counter = await this.counterRepo.save(counter);
    }

    return {
      id: counter.id,
      tenantId: counter.tenantId,
      prefix: counter.prefix,
      currentValue: counter.currentValue,
      createdAt: counter.createdAt,
      updatedAt: counter.updatedAt,
    };
  }
}
