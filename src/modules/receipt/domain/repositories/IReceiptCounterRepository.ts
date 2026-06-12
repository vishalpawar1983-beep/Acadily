import type { ReceiptCounter } from '../entities/ReceiptCounter.js';

export interface IReceiptCounterRepository {
  findByTenant(tenantId: string): Promise<ReceiptCounter | null>;
  save(counter: ReceiptCounter): Promise<ReceiptCounter>;
  incrementAndGet(tenantId: string): Promise<{ receiptNumber: string; currentValue: number }>;
}
