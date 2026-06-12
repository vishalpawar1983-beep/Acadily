import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IEmailTemplateRepository } from '../domain/repositories/IEmailTemplateRepository.js';

export interface ListTemplatesRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ListTemplatesResponse {
  templates: Array<{
    id: string;
    templateName: string;
    subject: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListTemplates implements UseCase<ListTemplatesRequest, ListTemplatesResponse> {
  constructor(private readonly repo: IEmailTemplateRepository) {}

  async execute(request: ListTemplatesRequest): Promise<ListTemplatesResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { templates, total } = await this.repo.findAll(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
    });

    return {
      templates: templates.map((t) => ({
        id: t.id,
        templateName: t.templateName,
        subject: t.subject,
        isActive: t.isActive,
        createdAt: t.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
