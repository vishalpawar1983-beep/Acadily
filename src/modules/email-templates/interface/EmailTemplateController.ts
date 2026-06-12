import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateTemplate } from '../application/CreateTemplate.js';
import { ListTemplates } from '../application/ListTemplates.js';
import { GetTemplate } from '../application/GetTemplate.js';
import { UpdateTemplate } from '../application/UpdateTemplate.js';
import { DeleteTemplate } from '../application/DeleteTemplate.js';
import { SendTemplatedEmail } from '../application/SendTemplatedEmail.js';
import { MongoEmailTemplateRepository } from '../infrastructure/MongoEmailTemplateRepository.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoEmailTemplateRepository();
const emailService = new EmailService();

export class EmailTemplateController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateTemplate(repo);
      const result = await useCase.execute({
        tenantId,
        templateName: req.body.templateName,
        subject: req.body.subject,
        body: req.body.body,
        isActive: req.body.isActive,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListTemplates(repo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetTemplate(repo);
      const result = await useCase.execute({
        tenantId,
        templateId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateTemplate(repo);
      const result = await useCase.execute({
        tenantId,
        templateId: req.params.id as string,
        templateName: req.body.templateName,
        subject: req.body.subject,
        body: req.body.body,
        isActive: req.body.isActive,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteTemplate(repo);
      await useCase.execute({
        tenantId,
        templateId: req.params.id as string,
      });
      res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
      next(err);
    }
  }

  async send(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SendTemplatedEmail(repo, emailService);
      const result = await useCase.execute({
        tenantId,
        templateName: req.body.templateName,
        recipientEmail: req.body.to,
        variables: req.body.variables ?? {},
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
