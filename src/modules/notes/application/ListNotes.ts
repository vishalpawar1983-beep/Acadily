import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentNoteRepository } from '../domain/repositories/IStudentNoteRepository.js';

export interface ListNotesRequest {
  tenantId: string;
  studentId?: string;
  skip?: number;
  limit?: number;
  search?: string;
}

export interface ListNotesResponse {
  notes: Array<{
    id: string;
    studentId: string;
    date: Date;
    particulars: string;
    addedBy: string;
    startTime: Date | null;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListNotes implements UseCase<ListNotesRequest, ListNotesResponse> {
  constructor(private readonly repo: IStudentNoteRepository) {}

  async execute(request: ListNotesRequest): Promise<ListNotesResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { notes, total } = request.studentId
      ? await this.repo.findByStudent(request.tenantId, request.studentId, { skip, limit, search: request.search })
      : await this.repo.findAll(request.tenantId, { skip, limit, search: request.search });

    return {
      notes: notes.map((n) => ({
        id: n.id,
        studentId: n.studentId,
        date: n.date,
        particulars: n.particulars,
        addedBy: n.addedBy,
        startTime: n.startTime,
        createdAt: n.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
