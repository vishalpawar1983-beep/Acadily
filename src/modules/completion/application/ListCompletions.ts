import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICourseCompletionRepository } from '../domain/repositories/ICourseCompletionRepository.js';

export interface ListCompletionsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  studentId?: string;
  courseId?: string;
  status?: string;
}

export interface ListCompletionsResponse {
  completions: Array<{
    id: string;
    studentId: string;
    courseId: string;
    completionDate: Date;
    certificateNumber: string | null;
    remarks: string | null;
    status: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListCompletions implements UseCase<ListCompletionsRequest, ListCompletionsResponse> {
  constructor(private readonly completionRepo: ICourseCompletionRepository) {}

  async execute(request: ListCompletionsRequest): Promise<ListCompletionsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { completions, total } = await this.completionRepo.findAll(request.tenantId, {
      skip,
      limit,
      studentId: request.studentId,
      courseId: request.courseId,
      status: request.status,
    });

    return {
      completions: completions.map((c) => ({
        id: c.id,
        studentId: c.studentId,
        courseId: c.courseId,
        completionDate: c.completionDate,
        certificateNumber: c.certificateNumber,
        remarks: c.remarks,
        status: c.status,
        createdAt: c.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
