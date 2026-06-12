import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateCustomField } from '../application/CreateCustomField.js';
import { ListCustomFields } from '../application/ListCustomFields.js';
import { GetCustomField } from '../application/GetCustomField.js';
import { UpdateCustomField } from '../application/UpdateCustomField.js';
import { DeleteCustomField } from '../application/DeleteCustomField.js';
import { MongoCustomFieldRepository } from '../infrastructure/MongoCustomFieldRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoCustomFieldRepository();

export class CustomFieldController {
  async createField(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateCustomField(repo);
      const result = await useCase.execute({
        tenantId,
        fieldName: req.body.fieldName,
        fieldType: req.body.fieldType,
        options: req.body.options,
        mandatory: req.body.mandatory,
        defaultValue: req.body.defaultValue,
        createdBy: req.user?.userId ?? 'unknown',
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listFields(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListCustomFields(repo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getField(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetCustomField(repo);
      const result = await useCase.execute({
        tenantId,
        fieldId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateField(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateCustomField(repo);
      const result = await useCase.execute({
        tenantId,
        fieldId: req.params.id as string,
        fieldName: req.body.fieldName,
        fieldType: req.body.fieldType,
        options: req.body.options,
        mandatory: req.body.mandatory,
        defaultValue: req.body.defaultValue,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteField(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteCustomField(repo);
      await useCase.execute({
        tenantId,
        fieldId: req.params.id as string,
      });
      res.json({ success: true, data: { message: 'Custom field deleted' } });
    } catch (err) {
      next(err);
    }
  }
}
