import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ISubjectRepository } from '../domain/repositories/ISubjectRepository.js';
import { Subject } from '../domain/entities/Subject.js';

export interface CreateSubjectRequest {
  tenantId: string;
  subjectName: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  semYear: string;
  courseId?: string;
  addedBy: string;
}

export interface CreateSubjectResponse {
  id: string;
  subjectName: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  semYear: string;
  courseId: string;
  addedBy: string;
  createdAt: Date;
}

export class CreateSubject implements UseCase<CreateSubjectRequest, CreateSubjectResponse> {
  constructor(private readonly subjectRepo: ISubjectRepository) {}

  async execute(request: CreateSubjectRequest): Promise<CreateSubjectResponse> {
    const subject = Subject.create({
      tenantId: request.tenantId,
      subjectName: request.subjectName,
      subjectCode: request.subjectCode,
      fullMarks: request.fullMarks,
      passMarks: request.passMarks,
      semYear: request.semYear,
      courseId: request.courseId || '',
      addedBy: request.addedBy,
    });

    const saved = await this.subjectRepo.save(subject);

    return {
      id: saved.id,
      subjectName: saved.subjectName,
      subjectCode: saved.subjectCode,
      fullMarks: saved.fullMarks,
      passMarks: saved.passMarks,
      semYear: saved.semYear,
      courseId: saved.courseId,
      addedBy: saved.addedBy,
      createdAt: saved.createdAt,
    };
  }
}
