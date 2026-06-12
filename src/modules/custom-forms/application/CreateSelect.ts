import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import { DefaultSelect } from '../domain/entities/DefaultSelect.js';

export interface CreateSelectRequest {
  tenantId: string;
  selectName: string;
  options: string[];
  mandatory?: boolean;
}

export interface CreateSelectResponse {
  id: string;
  selectName: string;
  options: string[];
  mandatory: boolean;
  createdAt: Date;
}

export class CreateSelect implements UseCase<CreateSelectRequest, CreateSelectResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: CreateSelectRequest): Promise<CreateSelectResponse> {
    const select = DefaultSelect.create({
      tenantId: request.tenantId,
      selectName: request.selectName,
      options: request.options,
      mandatory: request.mandatory,
    });

    const saved = await this.repo.saveSelect(select);

    return {
      id: saved.id,
      selectName: saved.selectName,
      options: saved.options,
      mandatory: saved.mandatory,
      createdAt: saved.createdAt,
    };
  }
}
