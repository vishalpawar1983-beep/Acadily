import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateTrainer } from '../application/CreateTrainer.js';
import { ListTrainers } from '../application/ListTrainers.js';
import { GetTrainer } from '../application/GetTrainer.js';
import { UpdateTrainer } from '../application/UpdateTrainer.js';
import { DeleteTrainer } from '../application/DeleteTrainer.js';
import { MongoTrainerRepository } from '../infrastructure/MongoTrainerRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoTrainerRepository();

export class TrainerController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateTrainer(repo);
      const result = await useCase.execute({
        tenantId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        specialization: req.body.specialization,
        isActive: req.body.isActive,
        createdBy: req.user?.userId ?? '',
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

      const useCase = new ListTrainers(repo);
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

      const useCase = new GetTrainer(repo);
      const result = await useCase.execute({
        tenantId,
        trainerId: req.params.id as string,
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

      const useCase = new UpdateTrainer(repo);
      const result = await useCase.execute({
        tenantId,
        trainerId: req.params.id as string,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        specialization: req.body.specialization,
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

      const useCase = new DeleteTrainer(repo);
      await useCase.execute({
        tenantId,
        trainerId: req.params.id as string,
      });
      res.json({ success: true, message: 'Trainer deleted' });
    } catch (err) {
      next(err);
    }
  }
}
