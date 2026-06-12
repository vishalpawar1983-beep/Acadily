import type { Timing } from '../entities/Timing.js';

export interface FindAllOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ITimingRepository {
  findById(tenantId: string, id: string): Promise<Timing | null>;
  findAll(
    tenantId: string,
    options?: FindAllOptions,
  ): Promise<{ timings: Timing[]; total: number }>;
  save(timing: Timing): Promise<Timing>;
  update(timing: Timing): Promise<Timing>;
  delete(tenantId: string, id: string): Promise<void>;
}
