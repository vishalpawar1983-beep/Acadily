import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeRepository } from '../domain/repositories/IFeeRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { StudentModel } from '../../student/infrastructure/StudentModel.js';
import { DayBookEntryModel } from '../../daybook/infrastructure/DayBookModel.js';

export interface DeleteFeePaymentRequest {
  tenantId: string;
  feeId: string;
}

export interface DeleteFeePaymentResponse {
  id: string;
  deleted: boolean;
}

export class DeleteFeePayment
  implements UseCase<DeleteFeePaymentRequest, DeleteFeePaymentResponse>
{
  constructor(private readonly feeRepo: IFeeRepository) {}

  async execute(request: DeleteFeePaymentRequest): Promise<DeleteFeePaymentResponse> {
    const payment = await this.feeRepo.findById(request.tenantId, request.feeId);
    if (!payment) {
      throw new NotFoundError('FeePayment', request.feeId);
    }

    // Remove DayBook entry linked to this receipt
    await DayBookEntryModel.deleteMany({
      tenantId: request.tenantId,
      receiptNumber: payment.receiptNumber,
      studentId: payment.studentId,
    }).exec();

    // Delete the fee payment record
    await this.feeRepo.delete(request.tenantId, request.feeId);

    // Recalculate student totals
    const remainingPayments = await this.feeRepo.findByStudent(
      request.tenantId,
      payment.studentId,
    );
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const student = await StudentModel.findOne({
      _id: payment.studentId,
      tenantId: request.tenantId,
    }).exec();

    if (student) {
      const remainingFees = student.enrollment.netFees - totalPaid;
      await StudentModel.findOneAndUpdate(
        { _id: payment.studentId, tenantId: request.tenantId },
        {
          'enrollment.totalPaid': totalPaid,
          'enrollment.remainingFees': remainingFees,
        },
      ).exec();
    }

    return {
      id: request.feeId,
      deleted: true,
    };
  }
}
