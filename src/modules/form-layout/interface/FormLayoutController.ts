import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { SaveLayout } from '../application/SaveLayout.js';
import { GetLayout } from '../application/GetLayout.js';
import { DeleteLayout } from '../application/DeleteLayout.js';
import { MongoFormLayoutRepository } from '../infrastructure/MongoFormLayoutRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoFormLayoutRepository();

export class FormLayoutController {
  async saveColumns(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SaveLayout(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.body.formId,
        type: 'column',
        items: req.body.columns,
        createdBy: req.user?.userId ?? 'unknown',
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getColumns(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetLayout(repo);
      const formId = req.query.formId as string | undefined;
      const result = await useCase.execute({
        tenantId,
        ...(formId ? { formId } : {}),
        type: 'column',
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteColumn(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteLayout(repo);
      await useCase.execute({
        tenantId,
        layoutId: req.params.id as string,
      });
      res.json({ success: true, data: { message: 'Column layout deleted' } });
    } catch (err) {
      next(err);
    }
  }

  async saveRows(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SaveLayout(repo);
      const result = await useCase.execute({
        tenantId,
        formId: req.body.formId,
        type: 'row',
        items: req.body.rows,
        createdBy: req.user?.userId ?? 'unknown',
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getRows(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetLayout(repo);
      const formId = req.query.formId as string | undefined;
      const result = await useCase.execute({
        tenantId,
        ...(formId ? { formId } : {}),
        type: 'row',
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteRow(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteLayout(repo);
      await useCase.execute({
        tenantId,
        layoutId: req.params.id as string,
      });
      res.json({ success: true, data: { message: 'Row layout deleted' } });
    } catch (err) {
      next(err);
    }
  }
}
