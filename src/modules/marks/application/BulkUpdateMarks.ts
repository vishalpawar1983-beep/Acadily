import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentMarksRepository } from '../domain/repositories/IStudentMarksRepository.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/errors.js';
import type { SubjectMark } from '../domain/entities/StudentMarks.js';

export interface BulkUpdateMarksRequest {
  tenantId: string;
  studentId: string;
  courseId: string;
  subjects: Array<{
    subjectId: string;
    theory: number | null;
    practical: number | null;
  }>;
}

export interface BulkUpdateMarksResponse {
  id: string;
  studentId: string;
  courseId: string;
  subjects: SubjectMark[];
  resultStatus: string;
  updatedAt: Date;
}

export class BulkUpdateMarks implements UseCase<BulkUpdateMarksRequest, BulkUpdateMarksResponse> {
  constructor(private readonly marksRepo: IStudentMarksRepository) {}

  async execute(request: BulkUpdateMarksRequest): Promise<BulkUpdateMarksResponse> {
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

    for (const subjectUpdate of request.subjects) {
      const subject = marks.subjects.find(
        (s) => s.subjectCode === subjectUpdate.subjectId || s.subjectName === subjectUpdate.subjectId,
      );
      if (!subject) {
        throw new ValidationError(
          `Subject ${subjectUpdate.subjectId} not found in student marks record`,
        );
      }
      subject.theory = subjectUpdate.theory;
      subject.practical = subjectUpdate.practical;
      subject.totalMarks = marks.calculateTotal(subjectUpdate.theory, subjectUpdate.practical);
    }

    // Update result status based on whether all subjects have marks
    const allCompleted = marks.subjects.every((s) => s.totalMarks !== null);
    const anyStarted = marks.subjects.some((s) => s.totalMarks !== null);
    if (allCompleted) {
      marks.setResultStatus('Completed');
    } else if (anyStarted) {
      marks.setResultStatus('InProgress');
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
