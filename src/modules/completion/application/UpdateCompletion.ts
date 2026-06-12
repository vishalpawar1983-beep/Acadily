import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseCompletionRepository } from '../domain/repositories/ICourseCompletionRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { CompletionStatus } from '../domain/entities/CourseCompletion.js';

export interface UpdateCompletionRequest {
  tenantId: string;
  completionId: string;
  completionDate?: string;
  certificateNumber?: string;
  remarks?: string;
  status?: CompletionStatus;
}

export interface UpdateCompletionResponse {
  id: string;
  studentId: string;
  courseId: string;
  completionDate: Date;
  certificateNumber: string | null;
  remarks: string | null;
  status: string;
  updatedAt: Date;
}

export class UpdateCompletion implements UseCase<UpdateCompletionRequest, UpdateCompletionResponse> {
  constructor(private readonly completionRepo: ICourseCompletionRepository) {}

  async execute(request: UpdateCompletionRequest): Promise<UpdateCompletionResponse> {
    const completion = await this.completionRepo.findById(request.tenantId, request.completionId);
    if (!completion) {
      throw new NotFoundError('CourseCompletion', request.completionId);
    }

    completion.updateDetails({
      completionDate: request.completionDate ? new Date(request.completionDate) : undefined,
      certificateNumber: request.certificateNumber,
      remarks: request.remarks,
      status: request.status,
    });

    const updated = await this.completionRepo.update(completion);

    return {
      id: updated.id,
      studentId: updated.studentId,
      courseId: updated.courseId,
      completionDate: updated.completionDate,
      certificateNumber: updated.certificateNumber,
      remarks: updated.remarks,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }
}
