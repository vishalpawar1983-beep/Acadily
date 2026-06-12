import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateTiming } from '../application/CreateTiming.js';
import { ListTimings } from '../application/ListTimings.js';
import { GetTiming } from '../application/GetTiming.js';
import { UpdateTiming } from '../application/UpdateTiming.js';
import { DeleteTiming } from '../application/DeleteTiming.js';
import { MongoTimingRepository } from '../infrastructure/MongoTimingRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoTimingRepository();

export class TimingController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateTiming(repo);
      const result = await useCase.execute({
        tenantId,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
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

      const useCase = new ListTimings(repo);
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

      const useCase = new GetTiming(repo);
      const result = await useCase.execute({
        tenantId,
        timingId: req.params.id as string,
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

      const useCase = new UpdateTiming(repo);
      const result = await useCase.execute({
        tenantId,
        timingId: req.params.id as string,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
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

      const useCase = new DeleteTiming(repo);
      await useCase.execute({
        tenantId,
        timingId: req.params.id as string,
      });
      res.json({ success: true, message: 'Timing deleted' });
    } catch (err) {
      next(err);
    }
  }
}
