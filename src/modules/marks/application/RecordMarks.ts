import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentMarksRepository } from '../domain/repositories/IStudentMarksRepository.js';
import { StudentMarks, type SubjectMark } from '../domain/entities/StudentMarks.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface RecordMarksRequest {
  tenantId: string;
  studentId: string;
  courseId: string;
  subjects?: SubjectMark[];
  resultStatus?: 'NotStarted' | 'InProgress' | 'Completed';
}

export interface RecordMarksResponse {
  id: string;
  studentId: string;
  courseId: string;
  subjects: SubjectMark[];
  resultStatus: string;
  createdAt: Date;
}

export class RecordMarks implements UseCase<RecordMarksRequest, RecordMarksResponse> {
  constructor(private readonly marksRepo: IStudentMarksRepository) {}

  async execute(request: RecordMarksRequest): Promise<RecordMarksResponse> {
    const existing = await this.marksRepo.findByStudentAndCourse(
      request.tenantId,
      request.studentId,
      request.courseId,
    );
    if (existing) {
      throw new ConflictError(`Marks already exist for student ${request.studentId} in course ${request.courseId}`);
    }

    const marks = StudentMarks.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      courseId: request.courseId,
      subjects: request.subjects,
      resultStatus: request.resultStatus,
    });

    const saved = await this.marksRepo.save(marks);

    return {
      id: saved.id,
      studentId: saved.studentId,
      courseId: saved.courseId,
      subjects: saved.subjects,
      resultStatus: saved.resultStatus,
      createdAt: saved.createdAt,
    };
  }
}
