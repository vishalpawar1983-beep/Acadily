import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentNoteRepository } from '../domain/repositories/IStudentNoteRepository.js';
import { StudentNote } from '../domain/entities/StudentNote.js';

export interface CreateNoteRequest {
  tenantId: string;
  studentId: string;
  date?: string;
  particulars: string;
  addedBy?: string;
  startTime?: string;
  endDate?: string;
}

export interface CreateNoteResponse {
  id: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  startTime: Date | null;
  endDate: Date | null;
  createdAt: Date;
}

export class CreateNote implements UseCase<CreateNoteRequest, CreateNoteResponse> {
  constructor(private readonly repo: IStudentNoteRepository) {}

  async execute(request: CreateNoteRequest): Promise<CreateNoteResponse> {
    const note = StudentNote.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      date: request.date,
      particulars: request.particulars,
      addedBy: request.addedBy,
      startTime: request.startTime,
      endDate: request.endDate,
    });

    const saved = await this.repo.save(note);

    return {
      id: saved.id,
      studentId: saved.studentId,
      date: saved.date,
      particulars: saved.particulars,
      addedBy: saved.addedBy,
      startTime: saved.startTime,
      endDate: saved.endDate,
      createdAt: saved.createdAt,
    };
  }
}
