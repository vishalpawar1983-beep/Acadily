import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetSelectRequest {
  tenantId: string;
  selectId: string;
}

export interface GetSelectResponse {
  id: string;
  selectName: string;
  options: string[];
  mandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetSelect implements UseCase<GetSelectRequest, GetSelectResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: GetSelectRequest): Promise<GetSelectResponse> {
    const select = await this.repo.findSelectById(request.tenantId, request.selectId);
    if (!select) {
      throw new NotFoundError('DefaultSelect', request.selectId);
    }

    return {
      id: select.id,
      selectName: select.selectName,
      options: select.options,
      mandatory: select.mandatory,
      createdAt: select.createdAt,
      updatedAt: select.updatedAt,
    };
  }
}
