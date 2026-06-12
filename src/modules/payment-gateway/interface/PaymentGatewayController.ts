import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { InitiatePayment } from '../application/InitiatePayment.js';
import { PaymentSuccess } from '../application/PaymentSuccess.js';
import { PaymentFailure } from '../application/PaymentFailure.js';
import { ListPaymentTransactions } from '../application/ListPaymentTransactions.js';
import { GetPaymentTransaction } from '../application/GetPaymentTransaction.js';
import { MongoPaymentTransactionRepository } from '../infrastructure/MongoPaymentTransactionRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoPaymentTransactionRepository();

export class PaymentGatewayController {
  async initiate(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new InitiatePayment(repo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        amount: req.body.amount,
        courseName: req.body.courseName,
        email: req.body.email,
        phone: req.body.phone,
        studentName: req.body.studentName,
        courseId: req.body.courseId,
        lateFees: req.body.lateFees,
        remainingFees: req.body.remainingFees,
        installmentCount: req.body.installmentCount,
        installmentAmount: req.body.installmentAmount,
        netCourseFees: req.body.netCourseFees,
        paymentOption: req.body.paymentOption,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async success(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.body.tenantId;
      if (!tenantId) return next(new ValidationError('tenantId is required in callback body'));

      const useCase = new PaymentSuccess(repo);
      const result = await useCase.execute({
        tenantId,
        transactionId: req.body.transactionId,
        gatewayResponse: req.body.gatewayResponse ?? req.body,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async failure(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.body.tenantId;
      if (!tenantId) return next(new ValidationError('tenantId is required in callback body'));

      const useCase = new PaymentFailure(repo);
      const result = await useCase.execute({
        tenantId,
        transactionId: req.body.transactionId,
        gatewayResponse: req.body.gatewayResponse ?? req.body,
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

      const useCase = new ListPaymentTransactions(repo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as string | undefined,
        studentId: req.query.studentId as string | undefined,
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

      const useCase = new GetPaymentTransaction(repo);
      const result = await useCase.execute({
        tenantId,
        id: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
