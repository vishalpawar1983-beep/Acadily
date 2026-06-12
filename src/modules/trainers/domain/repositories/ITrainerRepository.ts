import type { Trainer } from '../entities/Trainer.js';

export interface FindAllOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ITrainerRepository {
  findById(tenantId: string, id: string): Promise<Trainer | null>;
  findByEmail(tenantId: string, email: string): Promise<Trainer | null>;
  findAll(
    tenantId: string,
    options?: FindAllOptions,
  ): Promise<{ trainers: Trainer[]; total: number }>;
  save(trainer: Trainer): Promise<Trainer>;
  update(trainer: Trainer): Promise<Trainer>;
  delete(tenantId: string, id: string): Promise<void>;
}
