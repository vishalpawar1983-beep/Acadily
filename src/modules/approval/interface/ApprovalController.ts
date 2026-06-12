import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateApproval } from '../application/CreateApproval.js';
import { ListApprovals } from '../application/ListApprovals.js';
import { GetApproval } from '../application/GetApproval.js';
import { ReviewApproval } from '../application/ReviewApproval.js';
import { ListPendingApprovals } from '../application/ListPendingApprovals.js';
import { MongoApprovalRepository } from '../infrastructure/MongoApprovalRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const approvalRepo = new MongoApprovalRepository();

export class ApprovalController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateApproval(approvalRepo);
      const result = await useCase.execute({
        tenantId,
        receiptId: req.body.receiptId,
        studentId: req.body.studentId,
        remarks: req.body.remarks,
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

      const useCase = new ListApprovals(approvalRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listPending(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListPendingApprovals(approvalRepo);
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

  async getByStudent(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListApprovals(approvalRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.studentId as string,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string | undefined,
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

      const useCase = new GetApproval(approvalRepo);
      const result = await useCase.execute({
        tenantId,
        approvalId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async review(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ReviewApproval(approvalRepo);
      const result = await useCase.execute({
        tenantId,
        approvalId: req.params.id as string,
        status: req.body.status,
        reviewedBy: req.body.reviewedBy,
        remarks: req.body.remarks,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
