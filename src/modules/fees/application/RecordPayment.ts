import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeRepository } from '../domain/repositories/IFeeRepository.js';
import type { IStudentRepository } from '../../student/domain/repositories/IStudentRepository.js';
import type { IDayBookRepository } from '../../daybook/domain/repositories/IDayBookRepository.js';
import type { IFeeInstallmentRepository } from '../../installments/domain/repositories/IFeeInstallmentRepository.js';
import { FeePayment } from '../domain/entities/FeePayment.js';
import { DayBookEntry } from '../../daybook/domain/entities/DayBookEntry.js';
import { ConflictError } from '../../../shared/domain/errors.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';

export interface RecordPaymentRequest {
  tenantId: string;
  studentId: string;
  courseId: string;
  netCourseFees: number;
  remainingFees: number;
  amountPaid: number;
  receiptNumber: string;
  paymentMethod: string;
  narration?: string;
  lateFees?: number;
  gstPercentage: number;
  addedBy: string;
  paymentDate?: string;
}

export interface RecordPaymentResponse {
  id: string;
  studentId: string;
  courseId: string;
  netCourseFees: number;
  remainingFees: number;
  amountPaid: number;
  receiptNumber: string;
  paymentMethod: string;
  lateFees: number;
  gstPercentage: number;
  paymentDate: Date;
  dayBookEntryId?: string;
  installmentsPaidCount?: number;
}

export class RecordPayment implements UseCase<RecordPaymentRequest, RecordPaymentResponse> {
  constructor(
    private readonly feeRepo: IFeeRepository,
    private readonly studentRepo: IStudentRepository,
    private readonly dayBookRepo: IDayBookRepository,
    private readonly installmentRepo: IFeeInstallmentRepository,
  ) {}

  async execute(request: RecordPaymentRequest): Promise<RecordPaymentResponse> {
    const payment = FeePayment.create({
      tenantId: request.tenantId,
      studentId: request.studentId,
      courseId: request.courseId,
      netCourseFees: request.netCourseFees,
      remainingFees: request.remainingFees,
      amountPaid: request.amountPaid,
      receiptNumber: request.receiptNumber,
      paymentMethod: request.paymentMethod,
      narration: request.narration,
      lateFees: request.lateFees,
      gstPercentage: request.gstPercentage,
      addedBy: request.addedBy,
      paymentDate: request.paymentDate ? new Date(request.paymentDate) : undefined,
    });

    let saved: FeePayment;
    try {
      saved = await this.feeRepo.save(payment);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictError('A payment with this receipt number already exists');
      }
      throw err;
    }

    // ── Post-payment cascade (mirrors legacy VPS behavior) ──
    let dayBookEntryId: string | undefined;
    let installmentsPaidCount = 0;

    try {
      // 1. Update student remaining fees and total paid
      const student = await this.studentRepo.findById(request.tenantId, request.studentId);
      if (student) {
        const currentRemaining = student.enrollment.remainingFees;
        const currentTotalPaid = student.enrollment.totalPaid;
        const newRemaining = Math.max(0, currentRemaining - request.amountPaid);

        student.updateDetails({
          enrollment: {
            remainingFees: newRemaining,
            totalPaid: currentTotalPaid + request.amountPaid,
          },
        });
        await this.studentRepo.update(student);

        logger.info(
          {
            studentId: request.studentId,
            previousRemaining: currentRemaining,
            newRemaining,
            amountPaid: request.amountPaid,
          },
          'Student balance updated after manual payment',
        );

        // 2. Create DayBook credit entry
        const dayBookEntry = DayBookEntry.create({
          tenantId: request.tenantId,
          accountId: '',
          narration: request.narration || `Fee payment - ${request.paymentMethod}`,
          credit: request.amountPaid,
          studentId: request.studentId,
          studentName: student.fullName,
          rollNumber: student.rollNumber,
          receiptNumber: saved.receiptNumber,
          linkAccountId: saved.id,
          linkAccountType: 'fee-payment',
        });
        const savedEntry = await this.dayBookRepo.saveEntry(dayBookEntry);
        dayBookEntryId = savedEntry.id;

        logger.info(
          { dayBookEntryId, receiptNumber: saved.receiptNumber },
          'DayBook entry created from manual payment',
        );
      } else {
        logger.warn(
          { studentId: request.studentId },
          'Student not found for post-payment processing',
        );
      }

      // 3. Auto-mark matching unpaid installments as paid (oldest first)
      const installments = await this.installmentRepo.findByStudentAndCourse(
        request.tenantId,
        request.studentId,
        request.courseId,
      );

      let remainingAmount = request.amountPaid;
      const paymentDate = request.paymentDate ? new Date(request.paymentDate) : new Date();

      for (const inst of installments) {
        if (inst.isPaid || inst.isDropout || remainingAmount <= 0) continue;

        const totalDue = inst.installmentAmount + inst.lateFeeAmount;
        if (remainingAmount >= totalDue) {
          inst.markPaid(paymentDate);
          await this.installmentRepo.update(inst);
          remainingAmount -= totalDue;
          installmentsPaidCount++;

          logger.info(
            { installmentId: inst.id, installmentNumber: inst.installmentNumber },
            'Installment auto-marked as paid',
          );
        }
      }
    } catch (postProcessError) {
      // Payment record is already saved — log but don't fail the request
      logger.error(
        { err: postProcessError, feePaymentId: saved.id },
        'Post-payment processing failed — fee payment record still saved',
      );
    }

    return {
      id: saved.id,
      studentId: saved.studentId,
      courseId: saved.courseId,
      netCourseFees: saved.netCourseFees,
      remainingFees: saved.remainingFees,
      amountPaid: saved.amountPaid,
      receiptNumber: saved.receiptNumber,
      paymentMethod: saved.paymentMethod,
      lateFees: saved.lateFees,
      gstPercentage: saved.gstPercentage,
      paymentDate: saved.paymentDate,
      dayBookEntryId,
      installmentsPaidCount,
    };
  }
}
