import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IBatchRepository } from '../domain/repositories/IBatchRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteBatchRequest {
  tenantId: string;
  batchId: string;
}

export interface DeleteBatchResponse {
  success: boolean;
}

export class DeleteBatch implements UseCase<DeleteBatchRequest, DeleteBatchResponse> {
  constructor(private readonly batchRepo: IBatchRepository) {}

  async execute(request: DeleteBatchRequest): Promise<DeleteBatchResponse> {
    const batch = await this.batchRepo.findById(request.tenantId, request.batchId);
    if (!batch) {
      throw new NotFoundError('Batch', request.batchId);
    }

    await this.batchRepo.delete(request.tenantId, request.batchId);

    return { success: true };
  }
}
