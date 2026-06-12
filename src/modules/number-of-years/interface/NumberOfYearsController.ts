import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateNumberOfYears } from '../application/CreateNumberOfYears.js';
import { GetNumberOfYears } from '../application/GetNumberOfYears.js';
import { ListNumberOfYears } from '../application/ListNumberOfYears.js';
import { UpdateNumberOfYears } from '../application/UpdateNumberOfYears.js';
import { DeleteNumberOfYears } from '../application/DeleteNumberOfYears.js';
import { MongoNumberOfYearsRepository } from '../infrastructure/MongoNumberOfYearsRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const numberOfYearsRepo = new MongoNumberOfYearsRepository();

export class NumberOfYearsController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new CreateNumberOfYears(numberOfYearsRepo);
      const result = await useCase.execute({
        tenantId,
        value: req.body.value,
        createdBy: userId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetNumberOfYears(numberOfYearsRepo);
      const result = await useCase.execute({
        tenantId,
        numberOfYearsId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListNumberOfYears(numberOfYearsRepo);
      const result = await useCase.execute({
        tenantId,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
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

      const useCase = new UpdateNumberOfYears(numberOfYearsRepo);
      const result = await useCase.execute({
        tenantId,
        numberOfYearsId: req.params.id as string,
        value: req.body.value,
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

      const useCase = new DeleteNumberOfYears(numberOfYearsRepo);
      const result = await useCase.execute({
        tenantId,
        numberOfYearsId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
