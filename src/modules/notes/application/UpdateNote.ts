import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentNoteRepository } from '../domain/repositories/IStudentNoteRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateNoteRequest {
  tenantId: string;
  noteId: string;
  particulars?: string;
  date?: string;
  startTime?: string | null;
  endDate?: string | null;
}

export interface UpdateNoteResponse {
  id: string;
  studentId: string;
  date: Date;
  particulars: string;
  addedBy: string;
  startTime: Date | null;
  updatedAt: Date;
}

export class UpdateNote implements UseCase<UpdateNoteRequest, UpdateNoteResponse> {
  constructor(private readonly repo: IStudentNoteRepository) {}

  async execute(request: UpdateNoteRequest): Promise<UpdateNoteResponse> {
    const note = await this.repo.findById(request.tenantId, request.noteId);
    if (!note) {
      throw new NotFoundError('StudentNote', request.noteId);
    }

    note.updateDetails({
      particulars: request.particulars,
      date: request.date ? new Date(request.date) : undefined,
      startTime: request.startTime === null ? null : request.startTime ? new Date(request.startTime) : undefined,
      endDate: request.endDate === null ? null : request.endDate ? new Date(request.endDate) : undefined,
    });

    const updated = await this.repo.update(note);

    return {
      id: updated.id,
      studentId: updated.studentId,
      date: updated.date,
      particulars: updated.particulars,
      addedBy: updated.addedBy,
      startTime: updated.startTime,
      updatedAt: updated.updatedAt,
    };
  }
}
