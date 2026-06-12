import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentMarksRepository } from '../domain/repositories/IStudentMarksRepository.js';
import type { SubjectMark } from '../domain/entities/StudentMarks.js';

export interface ListMarksRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  studentId?: string;
  courseId?: string;
  resultStatus?: string;
}

export interface ListMarksResponse {
  marks: Array<{
    id: string;
    studentId: string;
    courseId: string;
    subjects: SubjectMark[];
    resultStatus: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListMarks implements UseCase<ListMarksRequest, ListMarksResponse> {
  constructor(private readonly marksRepo: IStudentMarksRepository) {}

  async execute(request: ListMarksRequest): Promise<ListMarksResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { marks, total } = await this.marksRepo.findAll(request.tenantId, {
      skip,
      limit,
      studentId: request.studentId,
      courseId: request.courseId,
      resultStatus: request.resultStatus,
    });

    return {
      marks: marks.map((m) => ({
        id: m.id,
        studentId: m.studentId,
        courseId: m.courseId,
        subjects: m.subjects,
        resultStatus: m.resultStatus,
        createdAt: m.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
