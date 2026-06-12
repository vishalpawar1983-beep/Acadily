import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ISubjectRepository } from '../domain/repositories/ISubjectRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateSubjectRequest {
  tenantId: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  fullMarks?: number;
  passMarks?: number;
  semYear?: string;
  courseId?: string;
}

export interface UpdateSubjectResponse {
  id: string;
  subjectName: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  semYear: string;
  courseId: string;
  addedBy: string;
  updatedAt: Date;
}

export class UpdateSubject implements UseCase<UpdateSubjectRequest, UpdateSubjectResponse> {
  constructor(private readonly subjectRepo: ISubjectRepository) {}

  async execute(request: UpdateSubjectRequest): Promise<UpdateSubjectResponse> {
    const subject = await this.subjectRepo.findById(request.tenantId, request.subjectId);
    if (!subject) {
      throw new NotFoundError('Subject', request.subjectId);
    }

    subject.updateDetails({
      subjectName: request.subjectName,
      subjectCode: request.subjectCode,
      fullMarks: request.fullMarks,
      passMarks: request.passMarks,
      semYear: request.semYear,
      courseId: request.courseId,
    });

    const updated = await this.subjectRepo.update(subject);

    return {
      id: updated.id,
      subjectName: updated.subjectName,
      subjectCode: updated.subjectCode,
      fullMarks: updated.fullMarks,
      passMarks: updated.passMarks,
      semYear: updated.semYear,
      courseId: updated.courseId,
      addedBy: updated.addedBy,
      updatedAt: updated.updatedAt,
    };
  }
}
