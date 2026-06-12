import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IEmailTemplateRepository } from '../domain/repositories/IEmailTemplateRepository.js';
import { EmailTemplate } from '../domain/entities/EmailTemplate.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateTemplateRequest {
  tenantId: string;
  templateName: string;
  subject: string;
  body: string;
  isActive?: boolean;
}

export interface CreateTemplateResponse {
  id: string;
  templateName: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
}

export class CreateTemplate implements UseCase<CreateTemplateRequest, CreateTemplateResponse> {
  constructor(private readonly repo: IEmailTemplateRepository) {}

  async execute(request: CreateTemplateRequest): Promise<CreateTemplateResponse> {
    const existing = await this.repo.findByName(request.tenantId, request.templateName);
    if (existing) {
      throw new ConflictError(`Email template "${request.templateName}" already exists`);
    }

    const template = EmailTemplate.create({
      tenantId: request.tenantId,
      templateName: request.templateName,
      subject: request.subject,
      body: request.body,
      isActive: request.isActive,
    });

    const saved = await this.repo.save(template);

    return {
      id: saved.id,
      templateName: saved.templateName,
      subject: saved.subject,
      body: saved.body,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
