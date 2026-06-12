import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { GetNextRollNumber } from '../application/GetNextRollNumber.js';
import { GetRollNumberCounter } from '../application/GetRollNumberCounter.js';
import { UpdateRollNumberCounter } from '../application/UpdateRollNumberCounter.js';
import { MongoRollNumberRepository } from '../infrastructure/MongoRollNumberRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoRollNumberRepository();

export class RollNumberController {
  async getNext(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetNextRollNumber(repo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCounter(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetRollNumberCounter(repo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateCounter(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateRollNumberCounter(repo);
      const result = await useCase.execute({
        tenantId,
        prefix: req.body.prefix,
        currentValue: req.body.currentValue,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
