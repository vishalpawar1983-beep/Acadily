import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateLab } from '../application/CreateLab.js';
import { ListLabs } from '../application/ListLabs.js';
import { GetLab } from '../application/GetLab.js';
import { UpdateLab } from '../application/UpdateLab.js';
import { DeleteLab } from '../application/DeleteLab.js';
import { MongoLabRepository } from '../infrastructure/MongoLabRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoLabRepository();

export class LabController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateLab(repo);
      const result = await useCase.execute({
        tenantId,
        labName: req.body.labName,
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

      const useCase = new ListLabs(repo);
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

  async getById(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetLab(repo);
      const result = await useCase.execute({
        tenantId,
        labId: req.params.id as string,
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

      const useCase = new UpdateLab(repo);
      const result = await useCase.execute({
        tenantId,
        labId: req.params.id as string,
        labName: req.body.labName,
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

      const useCase = new DeleteLab(repo);
      await useCase.execute({
        tenantId,
        labId: req.params.id as string,
      });
      res.json({ success: true, message: 'Lab deleted' });
    } catch (err) {
      next(err);
    }
  }
}
