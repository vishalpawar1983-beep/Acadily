import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentNoteRepository } from '../domain/repositories/IStudentNoteRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetNoteRequest {
  tenantId: string;
  noteId: string;
}

export interface GetNoteResponse {
  id: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  startTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GetNote implements UseCase<GetNoteRequest, GetNoteResponse> {
  constructor(private readonly repo: IStudentNoteRepository) {}

  async execute(request: GetNoteRequest): Promise<GetNoteResponse> {
    const note = await this.repo.findById(request.tenantId, request.noteId);
    if (!note) {
      throw new NotFoundError('StudentNote', request.noteId);
    }

    return {
      id: note.id,
      studentId: note.studentId,
      date: note.date,
      particulars: note.particulars,
      addedBy: note.addedBy,
      startTime: note.startTime,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
