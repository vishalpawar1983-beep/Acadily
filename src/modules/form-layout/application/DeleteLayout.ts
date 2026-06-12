import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFormLayoutRepository } from '../domain/repositories/IFormLayoutRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteLayoutRequest {
  tenantId: string;
  layoutId: string;
}

export interface DeleteLayoutResponse {
  success: boolean;
}

export class DeleteLayout implements UseCase<DeleteLayoutRequest, DeleteLayoutResponse> {
  constructor(private readonly repo: IFormLayoutRepository) {}

  async execute(request: DeleteLayoutRequest): Promise<DeleteLayoutResponse> {
    const layout = await this.repo.findById(request.tenantId, request.layoutId);
    if (!layout) {
      throw new NotFoundError('FormLayout', request.layoutId);
    }

    await this.repo.delete(request.tenantId, request.layoutId);

    return { success: true };
  }
}
