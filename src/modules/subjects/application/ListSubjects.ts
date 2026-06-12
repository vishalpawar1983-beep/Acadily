import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ISubjectRepository } from '../domain/repositories/ISubjectRepository.js';

export interface ListSubjectsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  courseId?: string;
}

export interface ListSubjectsResponse {
  subjects: Array<{
    id: string;
    subjectName: string;
    subjectCode: string;
    fullMarks: number;
    passMarks: number;
    semYear: string;
    courseId: string;
    addedBy: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListSubjects implements UseCase<ListSubjectsRequest, ListSubjectsResponse> {
  constructor(private readonly subjectRepo: ISubjectRepository) {}

  async execute(request: ListSubjectsRequest): Promise<ListSubjectsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { subjects, total } = await this.subjectRepo.findAll(request.tenantId, {
      skip,
      limit,
      courseId: request.courseId,
    });

    return {
      subjects: subjects.map((s) => ({
        id: s.id,
        subjectName: s.subjectName,
        subjectCode: s.subjectCode,
        fullMarks: s.fullMarks,
        passMarks: s.passMarks,
        semYear: s.semYear,
        courseId: s.courseId,
        addedBy: s.addedBy,
        createdAt: s.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
