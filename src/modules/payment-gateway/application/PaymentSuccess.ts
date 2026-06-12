import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentTransactionRepository } from '../domain/repositories/IPaymentTransactionRepository.js';
import { NotFoundError, ConflictError, ValidationError } from '../../../shared/domain/errors.js';
import { verifyPaymentHash } from '../../../shared/infrastructure/payment/EasebuzzService.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';
import { config } from '../../../config/index.js';
import { FeePayment } from '../../fees/domain/entities/FeePayment.js';
import { MongoFeeRepository } from '../../fees/infrastructure/MongoFeeRepository.js';
import { DayBookEntry } from '../../daybook/domain/entities/DayBookEntry.js';
import { MongoDayBookRepository } from '../../daybook/infrastructure/MongoDayBookRepository.js';
import { MongoStudentRepository } from '../../student/infrastructure/MongoStudentRepository.js';

export interface PaymentSuccessRequest {
  tenantId: string;
  transactionId: string;
  gatewayResponse: Record<string, unknown>;
}

export interface PaymentSuccessResponse {
  id: string;
  transactionId: string;
  studentId: string;
  amount: number;
  status: string;
  courseId: string;
  feePaymentId?: string;
  dayBookEntryId?: string;
  updatedAt: Date;
}

export class PaymentSuccess implements UseCase<PaymentSuccessRequest, PaymentSuccessResponse> {
  constructor(private readonly repo: IPaymentTransactionRepository) {}

  async execute(request: PaymentSuccessRequest): Promise<PaymentSuccessResponse> {
    const transaction = await this.repo.findByTransactionId(request.tenantId, request.transactionId);
    if (!transaction) {
      throw new NotFoundError('PaymentTransaction', request.transactionId);
    }

    // Idempotency: if already processed, return existing result without re-processing
    if (transaction.status === 'success') {
      logger.warn(
        { transactionId: request.transactionId },
        'Payment already processed as success — skipping duplicate callback',
      );
      return {
        id: transaction.id,
        transactionId: transaction.transactionId,
        studentId: transaction.studentId,
        amount: transaction.amount,
        status: transaction.status,
        courseId: transaction.courseId,
        updatedAt: transaction.updatedAt,
      };
    }

    if (transaction.status === 'failure') {
      throw new ConflictError('PaymentTransaction already marked as failure, cannot mark as success');
    }

    // Verify Easebuzz response hash
    const gw = request.gatewayResponse;
    const isProd = config.NODE_ENV === 'production' || config.NODE_ENV === 'staging';

    if (gw.hash && gw.status && gw.email && gw.firstname && gw.productinfo && gw.amount) {
      const isValid = verifyPaymentHash({
        txnid: request.transactionId,
        amount: Number(gw.amount),
        productinfo: String(gw.productinfo),
        firstname: String(gw.firstname),
        email: String(gw.email),
        status: String(gw.status),
        hash: String(gw.hash),
        udf1: gw.udf1 ? String(gw.udf1) : undefined,
        udf2: gw.udf2 ? String(gw.udf2) : undefined,
        udf3: gw.udf3 ? String(gw.udf3) : undefined,
        udf4: gw.udf4 ? String(gw.udf4) : undefined,
        udf5: gw.udf5 ? String(gw.udf5) : undefined,
        udf6: gw.udf6 ? String(gw.udf6) : undefined,
        udf7: gw.udf7 ? String(gw.udf7) : undefined,
      });

      if (!isValid) {
        logger.error(
          { transactionId: request.transactionId },
          'Easebuzz hash verification FAILED — rejecting payment callback',
        );
        throw new ValidationError('Payment hash verification failed');
      }

      logger.info(
        { transactionId: request.transactionId },
        'Easebuzz hash verification passed',
      );
    } else if (isProd) {
      logger.error(
        { transactionId: request.transactionId },
        'Missing hash fields in payment callback — rejecting in production',
      );
      throw new ValidationError('Payment callback missing required hash fields');
    } else {
      logger.warn(
        { transactionId: request.transactionId },
        'No Easebuzz hash in gateway response, skipping verification (dev mode)',
      );
    }

    transaction.markSuccess(request.gatewayResponse);
    const updated = await this.repo.update(transaction);

    // ── Post-payment processing (mirrors legacy VPS behavior) ──
    let feePaymentId: string | undefined;
    let dayBookEntryId: string | undefined;

    try {
      // Parse UDF fields from gateway response
      const studentId = gw.udf1 ? String(gw.udf1) : updated.studentId;
      const udf2Str = gw.udf2 ? String(gw.udf2) : '';
      const parsedUdf3 = gw.udf3 ? Number(gw.udf3) : 0;
      const remainingFeesFromGw = isNaN(parsedUdf3) ? 0 : parsedUdf3;
      const parsedUdf6 = gw.udf6 ? Number(gw.udf6) : updated.amount;
      const netCourseFees = isNaN(parsedUdf6) ? updated.amount : parsedUdf6;

      // Parse courseName and lateFees from udf2 (format: courseName=X&lateFees=Y)
      const udf2Params = new URLSearchParams(udf2Str);
      const courseName = udf2Params.get('courseName') ?? '';
      const parsedLateFees = Number(udf2Params.get('lateFees') ?? 0);
      const lateFees = isNaN(parsedLateFees) ? 0 : parsedLateFees;

      const amount = updated.amount;
      const newRemainingFees = Math.max(0, remainingFeesFromGw - amount);

      // 1. Create FeePayment record
      const feeRepo = new MongoFeeRepository();
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const feePayment = FeePayment.create({
        tenantId: request.tenantId,
        studentId,
        courseId: updated.courseId,
        netCourseFees,
        remainingFees: newRemainingFees,
        amountPaid: amount,
        receiptNumber,
        paymentMethod: 'online-easebuzz',
        narration: `Online payment via Easebuzz (Txn: ${updated.transactionId})`,
        lateFees,
        gstPercentage: 0,
        addedBy: 'system',
      });
      const savedFee = await feeRepo.save(feePayment);
      feePaymentId = savedFee.id;

      logger.info(
        { transactionId: updated.transactionId, feePaymentId, amount },
        'Fee payment record created from online payment',
      );

      // 2. Update student remaining fees and total paid
      const studentRepo = new MongoStudentRepository();
      const student = await studentRepo.findById(request.tenantId, studentId);
      if (student) {
        const currentRemaining = student.enrollment.remainingFees;
        const currentTotalPaid = student.enrollment.totalPaid;
        student.updateDetails({
          enrollment: {
            remainingFees: Math.max(0, currentRemaining - amount),
            totalPaid: currentTotalPaid + amount,
          },
        });
        await studentRepo.update(student);

        logger.info(
          { studentId, previousRemaining: currentRemaining, newRemaining: Math.max(0, currentRemaining - amount) },
          'Student remaining fees updated after online payment',
        );

        // 3. Create DayBook entry
        const dayBookRepo = new MongoDayBookRepository();
        const dayBookEntry = DayBookEntry.create({
          tenantId: request.tenantId,
          accountId: '',
          narration: `Online payment - ${courseName || 'Course Fees'} (Txn: ${updated.transactionId})`,
          credit: amount,
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          receiptNumber,
          linkAccountId: savedFee.id,
          linkAccountType: 'fee-payment',
        });
        const savedEntry = await dayBookRepo.saveEntry(dayBookEntry);
        dayBookEntryId = savedEntry.id;

        logger.info(
          { transactionId: updated.transactionId, dayBookEntryId },
          'DayBook entry created from online payment',
        );
      } else {
        logger.warn(
          { studentId, transactionId: updated.transactionId },
          'Student not found for post-payment processing',
        );
      }
    } catch (postProcessError) {
      // Never fail the payment callback due to post-processing errors
      logger.error(
        { err: postProcessError, transactionId: updated.transactionId },
        'Post-payment processing failed — payment still marked as success',
      );
    }

    return {
      id: updated.id,
      transactionId: updated.transactionId,
      studentId: updated.studentId,
      amount: updated.amount,
      status: updated.status,
      courseId: updated.courseId,
      feePaymentId,
      dayBookEntryId,
      updatedAt: updated.updatedAt,
    };
  }
}
