import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseCompletionRepository } from '../domain/repositories/ICourseCompletionRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetCompletionRequest {
  tenantId: string;
  completionId: string;
}

export interface GetCompletionResponse {
  id: string;
  studentId: string;
  courseId: string;
  completionDate: Date;
  certificateNumber: string | null;
  remarks: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetCompletion implements UseCase<GetCompletionRequest, GetCompletionResponse> {
  constructor(private readonly completionRepo: ICourseCompletionRepository) {}

  async execute(request: GetCompletionRequest): Promise<GetCompletionResponse> {
    const completion = await this.completionRepo.findById(request.tenantId, request.completionId);
    if (!completion) {
      throw new NotFoundError('CourseCompletion', request.completionId);
    }

    return {
      id: completion.id,
      studentId: completion.studentId,
      courseId: completion.courseId,
      completionDate: completion.completionDate,
      certificateNumber: completion.certificateNumber,
      remarks: completion.remarks,
      status: completion.status,
      createdAt: completion.createdAt,
      updatedAt: completion.updatedAt,
    };
  }
}
