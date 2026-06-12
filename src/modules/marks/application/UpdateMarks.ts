import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentMarksRepository } from '../domain/repositories/IStudentMarksRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { SubjectMark, ResultStatus } from '../domain/entities/StudentMarks.js';

export interface UpdateMarksRequest {
  tenantId: string;
  marksId: string;
  subjects?: SubjectMark[];
  resultStatus?: ResultStatus;
}

export interface UpdateMarksResponse {
  id: string;
  studentId: string;
  courseId: string;
  subjects: SubjectMark[];
  resultStatus: string;
  updatedAt: Date;
}

export class UpdateMarks implements UseCase<UpdateMarksRequest, UpdateMarksResponse> {
  constructor(private readonly marksRepo: IStudentMarksRepository) {}

  async execute(request: UpdateMarksRequest): Promise<UpdateMarksResponse> {
    const marks = await this.marksRepo.findById(request.tenantId, request.marksId);
    if (!marks) {
      throw new NotFoundError('StudentMarks', request.marksId);
    }

    if (request.subjects !== undefined) {
      marks.updateSubjects(request.subjects);
    }

    if (request.resultStatus !== undefined) {
      marks.setResultStatus(request.resultStatus);
    }

    const updated = await this.marksRepo.update(marks);

    return {
      id: updated.id,
      studentId: updated.studentId,
      courseId: updated.courseId,
      subjects: updated.subjects,
      resultStatus: updated.resultStatus,
      updatedAt: updated.updatedAt,
    };
  }
}
