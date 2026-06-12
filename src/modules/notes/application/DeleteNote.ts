import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentNoteRepository } from '../domain/repositories/IStudentNoteRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteNoteRequest {
  tenantId: string;
  noteId: string;
}

export interface DeleteNoteResponse {
  success: boolean;
}

export class DeleteNote implements UseCase<DeleteNoteRequest, DeleteNoteResponse> {
  constructor(private readonly repo: IStudentNoteRepository) {}

  async execute(request: DeleteNoteRequest): Promise<DeleteNoteResponse> {
    const note = await this.repo.findById(request.tenantId, request.noteId);
    if (!note) {
      throw new NotFoundError('StudentNote', request.noteId);
    }

    await this.repo.delete(request.tenantId, request.noteId);

    return { success: true };
  }
}
