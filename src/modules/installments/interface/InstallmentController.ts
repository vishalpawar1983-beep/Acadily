import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateInstallment } from '../application/CreateInstallment.js';
import { GetStudentInstallments } from '../application/GetStudentInstallments.js';
import { ListInstallments } from '../application/ListInstallments.js';
import { MarkInstallmentPaid } from '../application/MarkInstallmentPaid.js';
import { ListOverdueInstallments } from '../application/ListOverdueInstallments.js';
import { ListInstallmentsByCompany } from '../application/ListInstallmentsByCompany.js';
import { CalculateLateFees } from '../application/CalculateLateFees.js';
import { GetOverdueWithLateFees } from '../application/GetOverdueWithLateFees.js';
import { MongoFeeInstallmentRepository } from '../infrastructure/MongoFeeInstallmentRepository.js';
import { MongoStudentRepository } from '../../student/infrastructure/MongoStudentRepository.js';
import { ValidationError, NotFoundError } from '../../../shared/domain/errors.js';

const installmentRepo = new MongoFeeInstallmentRepository();
const studentRepo = new MongoStudentRepository();

export class InstallmentController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateInstallment(installmentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        courseId: req.body.courseId,
        installmentNumber: req.body.installmentNumber,
        installmentAmount: req.body.installmentAmount,
        dueDate: req.body.dueDate,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const installment = await installmentRepo.findById(tenantId, req.params.id as string);
      if (!installment) {
        return next(new NotFoundError('FeeInstallment', req.params.id as string));
      }
      res.json({
        success: true,
        data: {
          id: installment.id,
          studentId: installment.studentId,
          courseId: installment.courseId,
          installmentNumber: installment.installmentNumber,
          installmentAmount: installment.installmentAmount,
          dueDate: installment.dueDate,
          paidDate: installment.paidDate,
          isPaid: installment.isPaid,
          isDropout: installment.isDropout,
          createdAt: installment.createdAt,
          updatedAt: installment.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async listByStudent(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetStudentInstallments(installmentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.studentId as string,
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

      const useCase = new ListInstallments(installmentRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        studentId: req.query.studentId as string | undefined,
        courseId: req.query.courseId as string | undefined,
        isPaid: req.query.isPaid !== undefined ? req.query.isPaid === 'true' : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async markPaid(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new MarkInstallmentPaid(installmentRepo);
      const result = await useCase.execute({
        tenantId,
        installmentId: req.params.id as string,
        paidDate: req.body.paidDate,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listOverdue(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListOverdueInstallments(installmentRepo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const installment = await installmentRepo.findById(tenantId, req.params.id as string);
      if (!installment) {
        return next(new NotFoundError('FeeInstallment', req.params.id as string));
      }

      installment.updateDetails({
        installmentAmount: req.body.installmentAmount,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });

      const updated = await installmentRepo.update(installment);
      res.json({
        success: true,
        data: {
          id: updated.id,
          studentId: updated.studentId,
          courseId: updated.courseId,
          installmentNumber: updated.installmentNumber,
          installmentAmount: updated.installmentAmount,
          dueDate: updated.dueDate,
          paidDate: updated.paidDate,
          isPaid: updated.isPaid,
          isDropout: updated.isDropout,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async listByCompany(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListInstallmentsByCompany(installmentRepo, studentRepo);
      const result = await useCase.execute({
        tenantId,
        companyId: req.params.companyId as string,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async calculateLateFees(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CalculateLateFees(installmentRepo);
      const result = await useCase.execute({
        tenantId,
        lateFeeAmount: req.body.lateFeeAmount,
        frequency: req.body.frequency,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listOverdueWithLateFees(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetOverdueWithLateFees(installmentRepo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
