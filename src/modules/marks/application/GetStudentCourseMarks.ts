import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentMarksRepository } from '../domain/repositories/IStudentMarksRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { SubjectMark } from '../domain/entities/StudentMarks.js';

export interface GetStudentCourseMarksRequest {
  tenantId: string;
  studentId: string;
  courseId: string;
}

export interface GetStudentCourseMarksResponse {
  id: string;
  studentId: string;
  courseId: string;
  subjects: SubjectMark[];
  resultStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetStudentCourseMarks
  implements UseCase<GetStudentCourseMarksRequest, GetStudentCourseMarksResponse>
{
  constructor(private readonly marksRepo: IStudentMarksRepository) {}

  async execute(request: GetStudentCourseMarksRequest): Promise<GetStudentCourseMarksResponse> {
    const marks = await this.marksRepo.findByStudentAndCourse(
      request.tenantId,
      request.studentId,
      request.courseId,
    );
    if (!marks) {
      throw new NotFoundError(
        'StudentMarks',
        `student ${request.studentId} in course ${request.courseId}`,
      );
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
