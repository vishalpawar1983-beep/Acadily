import type { UseCase } from "../../../shared/application/UseCase.js";
import type { IReceiptCounterRepository } from "../domain/repositories/IReceiptCounterRepository.js";
import type { ITenantRepository } from "../../tenant/domain/repositories/ITenantRepository.js";
import { ReceiptCounter } from "../domain/entities/ReceiptCounter.js";

export interface GetNextReceiptNumberRequest {
  tenantId: string;
  companyPrefix?: string;
}

export interface GetNextReceiptNumberResponse {
  receiptNumber: string;
  currentValue: number;
}

export class GetNextReceiptNumber implements UseCase<
  GetNextReceiptNumberRequest,
  GetNextReceiptNumberResponse
> {
  constructor(
    private readonly counterRepo: IReceiptCounterRepository,
    private readonly tenantRepo: ITenantRepository,
  ) {}

  async execute(
    request: GetNextReceiptNumberRequest,
  ): Promise<GetNextReceiptNumberResponse> {
    const rawPrefix = request.companyPrefix?.trim() || "";
    let prefix = rawPrefix;
    let parsedValue: number | undefined;

    const prefixMatch = rawPrefix.match(/^(.+)-(\d+)$/);
    if (prefixMatch) {
      prefix = prefixMatch[1];
      parsedValue = Number(prefixMatch[2]);
    }

    if (!prefix) {
      const tenant = await this.tenantRepo.findById(request.tenantId);
      prefix = tenant?.config.receiptPrefix || "VM";
    }

    // Ensure counter exists with correct prefix and minimum value
    let counter = await this.counterRepo.findByTenant(request.tenantId);
    if (!counter) {
      counter = ReceiptCounter.create({
        tenantId: request.tenantId,
        prefix,
        currentValue: parsedValue ?? 0,
      });
      await this.counterRepo.save(counter);
    } else {
      if (counter.prefix !== prefix) {
        counter.updatePrefix(prefix);
      }
      if (parsedValue !== undefined && parsedValue > counter.currentValue) {
        counter.resetCounter(parsedValue);
      }
      if (counter.prefix !== prefix || parsedValue !== undefined) {
        await this.counterRepo.save(counter);
      }
    }

    return this.counterRepo.incrementAndGet(request.tenantId);
  }
}
