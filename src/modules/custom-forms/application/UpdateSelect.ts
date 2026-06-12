import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateSelectRequest {
  tenantId: string;
  selectId: string;
  selectName?: string;
  options?: string[];
  mandatory?: boolean;
}

export interface UpdateSelectResponse {
  id: string;
  selectName: string;
  options: string[];
  mandatory: boolean;
  updatedAt: Date;
}

export class UpdateSelect implements UseCase<UpdateSelectRequest, UpdateSelectResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: UpdateSelectRequest): Promise<UpdateSelectResponse> {
    const select = await this.repo.findSelectById(request.tenantId, request.selectId);
    if (!select) {
      throw new NotFoundError('DefaultSelect', request.selectId);
    }

    select.updateDetails({
      selectName: request.selectName,
      options: request.options,
      mandatory: request.mandatory,
    });

    const updated = await this.repo.updateSelect(select);

    return {
      id: updated.id,
      selectName: updated.selectName,
      options: updated.options,
      mandatory: updated.mandatory,
      updatedAt: updated.updatedAt,
    };
  }
}
