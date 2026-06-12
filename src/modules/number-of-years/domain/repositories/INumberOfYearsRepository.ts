import { NumberOfYears } from '../entities/NumberOfYears.js';

export interface INumberOfYearsRepository {
  findById(tenantId: string, id: string): Promise<NumberOfYears | null>;
  findAll(
    tenantId: string,
    options?: { skip?: number; limit?: number },
  ): Promise<{ numberOfYears: NumberOfYears[]; total: number }>;
  save(numberOfYears: NumberOfYears): Promise<NumberOfYears>;
  update(numberOfYears: NumberOfYears): Promise<NumberOfYears>;
  delete(tenantId: string, id: string): Promise<void>;
  count(tenantId: string): Promise<number>;
}
