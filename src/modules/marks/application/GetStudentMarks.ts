import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentMarksRepository } from '../domain/repositories/IStudentMarksRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { SubjectMark } from '../domain/entities/StudentMarks.js';

export interface GetStudentMarksRequest {
  tenantId: string;
  marksId: string;
}

export interface GetStudentMarksResponse {
  id: string;
  studentId: string;
  courseId: string;
  subjects: SubjectMark[];
  resultStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetStudentMarks implements UseCase<GetStudentMarksRequest, GetStudentMarksResponse> {
  constructor(private readonly marksRepo: IStudentMarksRepository) {}

  async execute(request: GetStudentMarksRequest): Promise<GetStudentMarksResponse> {
    const marks = await this.marksRepo.findById(request.tenantId, request.marksId);
    if (!marks) {
      throw new NotFoundError('StudentMarks', request.marksId);
    }

    return {
      id: marks.id,
      studentId: marks.studentId,
      courseId: marks.courseId,
      subjects: marks.subjects,
      resultStatus: marks.resultStatus,
      createdAt: marks.createdAt,
      updatedAt: marks.updatedAt,
    };
  }
}
