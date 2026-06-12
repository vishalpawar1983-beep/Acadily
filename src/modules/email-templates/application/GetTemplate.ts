import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IEmailTemplateRepository } from '../domain/repositories/IEmailTemplateRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetTemplateRequest {
  tenantId: string;
  templateId: string;
}

export interface GetTemplateResponse {
  id: string;
  templateName: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetTemplate implements UseCase<GetTemplateRequest, GetTemplateResponse> {
  constructor(private readonly repo: IEmailTemplateRepository) {}

  async execute(request: GetTemplateRequest): Promise<GetTemplateResponse> {
    const template = await this.repo.findById(request.tenantId, request.templateId);
    if (!template) {
      throw new NotFoundError('EmailTemplate', request.templateId);
    }

    return {
      id: template.id,
      templateName: template.templateName,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
