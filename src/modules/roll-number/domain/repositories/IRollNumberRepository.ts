import type { RollNumberCounter } from '../entities/RollNumberCounter.js';

export interface IRollNumberRepository {
  findByTenant(tenantId: string): Promise<RollNumberCounter | null>;
  incrementAndGet(tenantId: string): Promise<string>;
  save(counter: RollNumberCounter): Promise<RollNumberCounter>;
  update(counter: RollNumberCounter): Promise<RollNumberCounter>;
}
