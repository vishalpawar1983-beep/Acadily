import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentTransactionRepository } from '../domain/repositories/IPaymentTransactionRepository.js';
import { PaymentTransaction } from '../domain/entities/PaymentTransaction.js';
import { config } from '../../../config/index.js';
import { initiatePayment as easebuzzInitiate } from '../../../shared/infrastructure/payment/EasebuzzService.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';

export interface InitiatePaymentRequest {
  tenantId: string;
  studentId: string;
  amount: number;
  courseName: string;
  email: string;
  phone: string;
  studentName: string;
  lateFees?: number;
  remainingFees?: number;
  installmentCount?: number;
  installmentAmount?: number;
  netCourseFees?: number;
  paymentOption?: string;
  courseId: string;
}

export interface InitiatePaymentResponse {
  id: string;
  transactionId: string;
  studentId: string;
  amount: number;
  status: string;
  paymentGateway: string;
  courseId: string;
  createdAt: Date;
  paymentUrl?: string;
  accessKey?: string;
}

export class InitiatePayment implements UseCase<InitiatePaymentRequest, InitiatePaymentResponse> {
  constructor(private readonly repo: IPaymentTransactionRepository) {}

  async execute(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    const transaction = PaymentTransaction.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      amount: request.amount,
      courseId: request.courseId,
    });

    const saved = await this.repo.save(transaction);

    let paymentUrl: string | undefined;
    let accessKey: string | undefined;

    const isProd = config.NODE_ENV === 'production' || config.NODE_ENV === 'staging';

    if (!config.EASEBUZZ_KEY || !config.EASEBUZZ_SALT) {
      if (isProd) {
        throw new Error('EASEBUZZ_KEY and EASEBUZZ_SALT must be configured in production');
      }
      logger.warn(
        { transactionId: saved.transactionId },
        'Easebuzz keys not configured, skipping payment gateway call (dev mode)',
      );
    } else {
      try {
        const easebuzzResponse = await easebuzzInitiate({
          txnid: saved.transactionId,
          amount: saved.amount,
          productinfo: 'Online Student Fees',
          firstname: request.studentName,
          email: request.email,
          phone: request.phone,
          udf1: request.studentId,
          udf2: `courseName=${encodeURIComponent(request.courseName)}&lateFees=${request.lateFees ?? 0}`,
          udf3: String(request.remainingFees ?? 0),
          udf4: String(request.installmentCount ?? 0),
          udf5: String(request.installmentAmount ?? 0),
          udf6: String(request.netCourseFees ?? 0),
          udf7: request.paymentOption ?? 'easebuzz',
        });

        paymentUrl = easebuzzResponse.paymentUrl;
        accessKey = easebuzzResponse.accessKey;
      } catch (error) {
        logger.error(
          { err: error, transactionId: saved.transactionId },
          'Easebuzz payment initiation failed',
        );
        throw error;
      }
    }

    return {
      id: saved.id,
      transactionId: saved.transactionId,
      studentId: saved.studentId,
      amount: saved.amount,
      status: saved.status,
      paymentGateway: saved.paymentGateway,
      courseId: saved.courseId,
      createdAt: saved.createdAt,
      paymentUrl,
      accessKey,
    };
  }
}
