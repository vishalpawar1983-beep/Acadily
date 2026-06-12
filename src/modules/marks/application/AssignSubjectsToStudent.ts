import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentMarksRepository } from '../domain/repositories/IStudentMarksRepository.js';
import { StudentMarks, type SubjectMark } from '../domain/entities/StudentMarks.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface AssignSubjectsRequest {
  tenantId: string;
  studentId: string;
  courseId: string;
  subjectIds: Array<{
    subjectName: string;
    subjectCode: string;
  }>;
}

export interface AssignSubjectsResponse {
  id: string;
  studentId: string;
  courseId: string;
  subjects: SubjectMark[];
  resultStatus: string;
  createdAt: Date;
}

export class AssignSubjectsToStudent implements UseCase<AssignSubjectsRequest, AssignSubjectsResponse> {
  constructor(private readonly marksRepo: IStudentMarksRepository) {}

  async execute(request: AssignSubjectsRequest): Promise<AssignSubjectsResponse> {
    const existing = await this.marksRepo.findByStudentAndCourse(
      request.tenantId,
      request.studentId,
      request.courseId,
    );
    if (existing) {
      throw new ConflictError(
        `Marks record already exists for student ${request.studentId} in course ${request.courseId}`,
      );
    }

    const subjects: SubjectMark[] = request.subjectIds.map((s) => ({
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      theory: null,
      practical: null,
      totalMarks: null,
      isActive: true,
    }));

    const marks = StudentMarks.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      courseId: request.courseId,
      subjects,
      resultStatus: 'NotStarted',
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
