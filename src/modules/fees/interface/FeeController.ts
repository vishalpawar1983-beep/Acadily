import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { RecordPayment } from '../application/RecordPayment.js';
import { GetStudentFees } from '../application/GetStudentFees.js';
import { ListFees } from '../application/ListFees.js';
import { GetFeePayment } from '../application/GetFeePayment.js';
import { UpdateFeePayment } from '../application/UpdateFeePayment.js';
import { DeleteFeePayment } from '../application/DeleteFeePayment.js';
import { GetNotPaidStudents } from '../application/GetNotPaidStudents.js';
import { ListAllFees } from '../application/ListAllFees.js';
import { MongoFeeRepository } from '../infrastructure/MongoFeeRepository.js';
import { MongoStudentRepository } from '../../student/infrastructure/MongoStudentRepository.js';
import { MongoDayBookRepository } from '../../daybook/infrastructure/MongoDayBookRepository.js';
import { MongoFeeInstallmentRepository } from '../../installments/infrastructure/MongoFeeInstallmentRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const feeRepo = new MongoFeeRepository();
const studentRepo = new MongoStudentRepository();
const dayBookRepo = new MongoDayBookRepository();
const installmentRepo = new MongoFeeInstallmentRepository();

export class FeeController {
  async recordPayment(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new RecordPayment(feeRepo, studentRepo, dayBookRepo, installmentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        courseId: req.body.courseId,
        netCourseFees: req.body.netCourseFees,
        remainingFees: req.body.remainingFees,
        amountPaid: req.body.amountPaid,
        receiptNumber: req.body.receiptNumber,
        paymentMethod: req.body.paymentMethod,
        narration: req.body.narration,
        lateFees: req.body.lateFees,
        gstPercentage: req.body.gstPercentage,
        addedBy: userId,
        paymentDate: req.body.paymentDate,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStudentFees(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetStudentFees(feeRepo);
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

      const useCase = new ListFees(feeRepo);
      const result = await useCase.execute({
        tenantId,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        studentId: req.query.studentId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getFeePayment(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetFeePayment(feeRepo);
      const result = await useCase.execute({
        tenantId,
        feeId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateFeePayment(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateFeePayment(feeRepo);
      const result = await useCase.execute({
        tenantId,
        feeId: req.params.id as string,
        amountPaid: req.body.amountPaid,
        narration: req.body.narration,
        amountDate: req.body.amountDate,
        lateFees: req.body.lateFees,
        receiptNumber: req.body.receiptNumber,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteFeePayment(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteFeePayment(feeRepo);
      const result = await useCase.execute({
        tenantId,
        feeId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getNotPaidStudents(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetNotPaidStudents(studentRepo);
      const result = await useCase.execute({
        tenantId,
        fromDate: req.body.fromDate,
        toDate: req.body.toDate,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listAllFees(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListAllFees(feeRepo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
