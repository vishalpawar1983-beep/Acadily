import type { UseCase } from "../../../shared/application/UseCase.js";
import type { IReceiptCounterRepository } from "../domain/repositories/IReceiptCounterRepository.js";
import { ReceiptCounter } from "../domain/entities/ReceiptCounter.js";

export interface UpdateReceiptCounterRequest {
  tenantId: string;
  prefix?: string;
  currentValue?: number;
}

export interface UpdateReceiptCounterResponse {
  id: string;
  tenantId: string;
  prefix: string;
  currentValue: number;
  updatedAt: Date;
}

export class UpdateReceiptCounter implements UseCase<
  UpdateReceiptCounterRequest,
  UpdateReceiptCounterResponse
> {
  constructor(private readonly counterRepo: IReceiptCounterRepository) {}

  async execute(
    request: UpdateReceiptCounterRequest,
  ): Promise<UpdateReceiptCounterResponse> {
    let counter = await this.counterRepo.findByTenant(request.tenantId);

    if (!counter) {
      // Create a new counter if one doesn't exist
      const defaultPrefix = request.prefix ?? "VM";
      const defaultValue = defaultPrefix === "VM" ? 2769 : 100;
      counter = ReceiptCounter.create({
        tenantId: request.tenantId,
        prefix: defaultPrefix,
        currentValue: request.currentValue ?? defaultValue,
      });
    } else {
      if (request.prefix !== undefined) counter.updatePrefix(request.prefix);
      if (request.currentValue !== undefined)
        counter.resetCounter(request.currentValue);
    }

    const saved = await this.counterRepo.save(counter);

    return {
      id: saved.id,
      tenantId: saved.tenantId,
      prefix: saved.prefix,
      currentValue: saved.currentValue,
      updatedAt: saved.updatedAt,
    };
  }
}
