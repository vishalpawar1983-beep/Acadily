import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseCompletionRepository } from '../domain/repositories/ICourseCompletionRepository.js';
import { CourseCompletion } from '../domain/entities/CourseCompletion.js';
import type { CompletionStatus } from '../domain/entities/CourseCompletion.js';

export interface RecordCompletionRequest {
  tenantId: string;
  studentId: string;
  courseId: string;
  completionDate?: string;
  certificateNumber?: string;
  remarks?: string;
  status?: CompletionStatus;
}

export interface RecordCompletionResponse {
  id: string;
  studentId: string;
  courseId: string;
  completionDate: Date;
  certificateNumber: string | null;
  remarks: string | null;
  status: string;
  createdAt: Date;
}

export class RecordCompletion implements UseCase<RecordCompletionRequest, RecordCompletionResponse> {
  constructor(private readonly completionRepo: ICourseCompletionRepository) {}

  async execute(request: RecordCompletionRequest): Promise<RecordCompletionResponse> {
    const completion = CourseCompletion.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      courseId: request.courseId,
      completionDate: request.completionDate,
      certificateNumber: request.certificateNumber,
      remarks: request.remarks,
      status: request.status,
    });

    const saved = await this.completionRepo.save(completion);

    return {
      id: saved.id,
      studentId: saved.studentId,
      courseId: saved.courseId,
      completionDate: saved.completionDate,
      certificateNumber: saved.certificateNumber,
      remarks: saved.remarks,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }
}
