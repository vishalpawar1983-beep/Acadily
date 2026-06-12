import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import { Batch } from '../domain/entities/Batch.js';
import type { BatchStudent } from '../domain/entities/Batch.js';


export interface CreateBatchRequest {
  tenantId: string;
  name: string;
  courseCategory?: string;
  course?: string;
  trainer?: string;
  startTime?: string;
  endTime?: string;
  startDate: string;
  endDate?: string;
  status?: 'completed' | 'inProgress';
  students?: BatchStudent[];
}

export interface CreateBatchResponse {
  id: string;
  name: string;
  courseCategory: string;
  course: string;
  trainer: string;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  students: BatchStudent[];
  isActive: boolean;
  createdAt: Date;
}

export class CreateBatch implements UseCase<CreateBatchRequest, CreateBatchResponse> {
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: CreateBatchRequest): Promise<CreateBatchResponse> {
    const batch = Batch.create({
      tenantId: request.tenantId,
      name: request.name,
      courseCategory: request.courseCategory,
      course: request.course,
      trainer: request.trainer,
      startTime: request.startTime,
      endTime: request.endTime,
      startDate: request.startDate,
      endDate: request.endDate,
      status: request.status,
      students: request.students,
    });

    const saved = await this.batchRepo.save(batch);

    return {
      id: saved.id,
      name: saved.name,
      courseCategory: saved.courseCategory,
      course: saved.course,
      trainer: saved.trainer,
      startTime: saved.startTime,
      endTime: saved.endTime,
      startDate: saved.startDate,
      endDate: saved.endDate,
      status: saved.status,
      students: saved.students,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
