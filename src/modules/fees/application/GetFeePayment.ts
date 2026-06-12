import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeRepository } from '../domain/repositories/IFeeRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetFeePaymentRequest {
  tenantId: string;
  feeId: string;
}

export interface GetFeePaymentResponse {
  id: string;
  studentId: string;
  courseId: string;
  netCourseFees: number;
  remainingFees: number;
  amountPaid: number;
  receiptNumber: string;
  paymentMethod: string;
  narration?: string;
  lateFees: number;
  gstPercentage: number;
  addedBy: string;
  paymentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class GetFeePayment implements UseCase<GetFeePaymentRequest, GetFeePaymentResponse> {
  constructor(private readonly feeRepo: IFeeRepository) {}

  async execute(request: GetFeePaymentRequest): Promise<GetFeePaymentResponse> {
    const payment = await this.feeRepo.findById(request.tenantId, request.feeId);
    if (!payment) {
      throw new NotFoundError('FeePayment', request.feeId);
    }

    return {
      id: payment.id,
      studentId: payment.studentId,
      courseId: payment.courseId,
      netCourseFees: payment.netCourseFees,
      remainingFees: payment.remainingFees,
      amountPaid: payment.amountPaid,
      receiptNumber: payment.receiptNumber,
      paymentMethod: payment.paymentMethod,
      narration: payment.narration,
      lateFees: payment.lateFees,
      gstPercentage: payment.gstPercentage,
      addedBy: payment.addedBy,
      paymentDate: payment.paymentDate,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
