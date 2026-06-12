import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IEmailTemplateRepository } from '../domain/repositories/IEmailTemplateRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteTemplateRequest {
  tenantId: string;
  templateId: string;
}

export interface DeleteTemplateResponse {
  success: boolean;
}

export class DeleteTemplate implements UseCase<DeleteTemplateRequest, DeleteTemplateResponse> {
  constructor(private readonly repo: IEmailTemplateRepository) {}

  async execute(request: DeleteTemplateRequest): Promise<DeleteTemplateResponse> {
    const template = await this.repo.findById(request.tenantId, request.templateId);
    if (!template) {
      throw new NotFoundError('EmailTemplate', request.templateId);
    }

    await this.repo.delete(request.tenantId, request.templateId);

    return { success: true };
  }
}
