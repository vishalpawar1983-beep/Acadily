import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IEmailTemplateRepository } from '../domain/repositories/IEmailTemplateRepository.js';
import { NotFoundError, ConflictError } from '../../../shared/domain/errors.js';

export interface UpdateTemplateRequest {
  tenantId: string;
  templateId: string;
  templateName?: string;
  subject?: string;
  body?: string;
  isActive?: boolean;
}

export interface UpdateTemplateResponse {
  id: string;
  templateName: string;
  subject: string;
  body: string;
  isActive: boolean;
  updatedAt: Date;
}

export class UpdateTemplate implements UseCase<UpdateTemplateRequest, UpdateTemplateResponse> {
  constructor(private readonly repo: IEmailTemplateRepository) {}

  async execute(request: UpdateTemplateRequest): Promise<UpdateTemplateResponse> {
    const template = await this.repo.findById(request.tenantId, request.templateId);
    if (!template) {
      throw new NotFoundError('EmailTemplate', request.templateId);
    }

    if (request.templateName && request.templateName !== template.templateName) {
      const existing = await this.repo.findByName(request.tenantId, request.templateName);
      if (existing) {
        throw new ConflictError(`Email template "${request.templateName}" already exists`);
      }
    }

    template.updateDetails({
      templateName: request.templateName,
      subject: request.subject,
      body: request.body,
      isActive: request.isActive,
    });

    const updated = await this.repo.update(template);

    return {
      id: updated.id,
      templateName: updated.templateName,
      subject: updated.subject,
      body: updated.body,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }
}
