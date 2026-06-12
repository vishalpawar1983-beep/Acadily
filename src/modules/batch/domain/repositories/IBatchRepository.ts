import type { Batch, BatchStudent } from '../entities/Batch.js';

export interface FindAllBatchOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
  status?: 'completed' | 'inProgress';
  search?: string;
  /** When set, restricts results to batches whose trainer field equals this Trainer entity _id. */
  trainerEntityId?: string;
}

export interface IBatchRepository {
  findById(tenantId: string, id: string): Promise<Batch | null>;
  findAll(
    tenantId: string,
    options?: FindAllBatchOptions,
  ): Promise<{ batches: Batch[]; total: number }>;
  findByCompany(tenantId: string, companyId: string): Promise<{ batches: Batch[]; total: number }>;
  save(batch: Batch): Promise<Batch>;
  update(batch: Batch): Promise<Batch>;
  delete(tenantId: string, id: string): Promise<void>;
  addStudent(tenantId: string, batchId: string, student: BatchStudent): Promise<Batch>;
  removeStudent(tenantId: string, batchId: string, studentId: string): Promise<Batch>;
  updateSubjectStatus(
    tenantId: string,
    batchId: string,
    studentId: string,
    subjectId: string,
    update: { status?: string; progress?: number; notes?: string },
  ): Promise<Batch>;
}
