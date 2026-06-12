import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { ListEmailLogs } from '../application/ListEmailLogs.js';
import { MongoEmailLogRepository } from '../infrastructure/MongoEmailLogRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const emailLogRepo = new MongoEmailLogRepository();

export class EmailLogController {
  async list(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListEmailLogs(emailLogRepo);
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
}
