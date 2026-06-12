import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateCommission } from '../application/CreateCommission.js';
import { ListCommissions } from '../application/ListCommissions.js';
import { GetCommission } from '../application/GetCommission.js';
import { UpdateCommission } from '../application/UpdateCommission.js';
import { DeleteCommission } from '../application/DeleteCommission.js';
import { MongoCommissionRepository } from '../infrastructure/MongoCommissionRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoCommissionRepository();

export class CommissionController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateCommission(repo);
      const result = await useCase.execute({
        tenantId,
        studentName: req.body.studentName,
        commissionPersonName: req.body.commissionPersonName,
        voucherNumber: req.body.voucherNumber,
        commissionAmount: req.body.commissionAmount,
        commissionPaid: req.body.commissionPaid,
        commissionDate: req.body.commissionDate,
        narration: req.body.narration,
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

      const useCase = new ListCommissions(repo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string | undefined,
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

      const useCase = new GetCommission(repo);
      const result = await useCase.execute({
        tenantId,
        commissionId: req.params.id as string,
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

      const useCase = new UpdateCommission(repo);
      const result = await useCase.execute({
        tenantId,
        commissionId: req.params.id as string,
        studentName: req.body.studentName,
        commissionPersonName: req.body.commissionPersonName,
        voucherNumber: req.body.voucherNumber,
        commissionAmount: req.body.commissionAmount,
        commissionPaid: req.body.commissionPaid,
        commissionDate: req.body.commissionDate,
        narration: req.body.narration,
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

      const useCase = new DeleteCommission(repo);
      await useCase.execute({
        tenantId,
        commissionId: req.params.id as string,
      });
      res.json({ success: true, message: 'Commission deleted' });
    } catch (err) {
      next(err);
    }
  }
}
