import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteEntryRequest {
  tenantId: string;
  entryId: string;
}

export interface DeleteEntryResponse {
  success: boolean;
}

export class DeleteEntry implements UseCase<DeleteEntryRequest, DeleteEntryResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: DeleteEntryRequest): Promise<DeleteEntryResponse> {
    const entry = await this.repo.findEntryById(request.tenantId, request.entryId);
    if (!entry) {
      throw new NotFoundError('DayBookEntry', request.entryId);
    }

    await this.repo.deleteEntry(request.tenantId, request.entryId);

    return { success: true };
  }
}
