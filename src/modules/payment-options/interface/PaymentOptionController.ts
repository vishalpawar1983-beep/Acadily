import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreatePaymentOption } from '../application/CreatePaymentOption.js';
import { ListPaymentOptions } from '../application/ListPaymentOptions.js';
import { UpdatePaymentOption } from '../application/UpdatePaymentOption.js';
import { DeletePaymentOption } from '../application/DeletePaymentOption.js';
import { MongoPaymentOptionRepository } from '../infrastructure/MongoPaymentOptionRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const paymentOptionRepo = new MongoPaymentOptionRepository();

export class PaymentOptionController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreatePaymentOption(paymentOptionRepo);
      const result = await useCase.execute({
        tenantId,
        name: req.body.name,
        isActive: req.body.isActive,
        createdBy: req.body.createdBy || req.user?.userId || 'system',
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

      const useCase = new ListPaymentOptions(paymentOptionRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string | undefined,
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

      const useCase = new UpdatePaymentOption(paymentOptionRepo);
      const result = await useCase.execute({
        tenantId,
        paymentOptionId: req.params.id as string,
        name: req.body.name,
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

      const useCase = new DeletePaymentOption(paymentOptionRepo);
      const result = await useCase.execute({
        tenantId,
        paymentOptionId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
