import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ISubjectRepository } from '../domain/repositories/ISubjectRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetSubjectRequest {
  tenantId: string;
  subjectId: string;
}

export interface GetSubjectResponse {
  id: string;
  subjectName: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  semYear: string;
  courseId: string;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetSubject implements UseCase<GetSubjectRequest, GetSubjectResponse> {
  constructor(private readonly subjectRepo: ISubjectRepository) {}

  async execute(request: GetSubjectRequest): Promise<GetSubjectResponse> {
    const subject = await this.subjectRepo.findById(request.tenantId, request.subjectId);
    if (!subject) {
      throw new NotFoundError('Subject', request.subjectId);
    }

    return {
      id: subject.id,
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      fullMarks: subject.fullMarks,
      passMarks: subject.passMarks,
      semYear: subject.semYear,
      courseId: subject.courseId,
      addedBy: subject.addedBy,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  }
}
