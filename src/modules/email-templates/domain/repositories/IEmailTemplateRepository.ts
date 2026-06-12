import type { EmailTemplate } from '../entities/EmailTemplate.js';

export interface FindAllOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface IEmailTemplateRepository {
  findById(tenantId: string, id: string): Promise<EmailTemplate | null>;
  findByName(tenantId: string, templateName: string): Promise<EmailTemplate | null>;
  findAll(
    tenantId: string,
    options?: FindAllOptions,
  ): Promise<{ templates: EmailTemplate[]; total: number }>;
  save(template: EmailTemplate): Promise<EmailTemplate>;
  update(template: EmailTemplate): Promise<EmailTemplate>;
  delete(tenantId: string, id: string): Promise<void>;
}
