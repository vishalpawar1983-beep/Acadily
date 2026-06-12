import { EmailTemplate } from '../domain/entities/EmailTemplate.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type {
  IEmailTemplateRepository,
  FindAllOptions,
} from '../domain/repositories/IEmailTemplateRepository.js';
import { EmailTemplateModel, type IEmailTemplateDocument } from './EmailTemplateModel.js';

export class MongoEmailTemplateRepository implements IEmailTemplateRepository {
  async findById(tenantId: string, id: string): Promise<EmailTemplate | null> {
    const doc = await EmailTemplateModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByName(tenantId: string, templateName: string): Promise<EmailTemplate | null> {
    const doc = await EmailTemplateModel.findOne({ tenantId, templateName }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<{ templates: EmailTemplate[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;

    const [docs, total] = await Promise.all([
      EmailTemplateModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      EmailTemplateModel.countDocuments(filter).exec(),
    ]);

    return {
      templates: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(template: EmailTemplate): Promise<EmailTemplate> {
    const doc = await EmailTemplateModel.create({
      _id: template.id,
      tenantId: template.tenantId,
      templateName: template.templateName,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
    return this.toDomain(doc);
  }

  async update(template: EmailTemplate): Promise<EmailTemplate> {
    const doc = await EmailTemplateModel.findOneAndUpdate(
      { _id: template.id, tenantId: template.tenantId },
      {
        templateName: template.templateName,
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('EmailTemplate', template.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await EmailTemplateModel.deleteOne({ _id: id, tenantId }).exec();
  }

  private toDomain(doc: IEmailTemplateDocument): EmailTemplate {
    return EmailTemplate.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      templateName: doc.templateName,
      subject: doc.subject,
      body: doc.body,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
