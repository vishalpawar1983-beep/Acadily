import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeRepository } from '../domain/repositories/IFeeRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { StudentModel } from '../../student/infrastructure/StudentModel.js';

export interface UpdateFeePaymentRequest {
  tenantId: string;
  feeId: string;
  amountPaid?: number;
  narration?: string;
  amountDate?: string;
  lateFees?: number;
  receiptNumber?: string;
}

export interface UpdateFeePaymentResponse {
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
  paymentDate: Date;
  updatedAt: Date;
}

export class UpdateFeePayment
  implements UseCase<UpdateFeePaymentRequest, UpdateFeePaymentResponse>
{
  constructor(private readonly feeRepo: IFeeRepository) {}

  async execute(request: UpdateFeePaymentRequest): Promise<UpdateFeePaymentResponse> {
    const existing = await this.feeRepo.findById(request.tenantId, request.feeId);
    if (!existing) {
      throw new NotFoundError('FeePayment', request.feeId);
    }

    const oldAmountPaid = existing.amountPaid;
    const newAmountPaid = request.amountPaid ?? existing.amountPaid;
    const amountDiff = newAmountPaid - oldAmountPaid;

    // Recalculate remaining fees based on the amount change
    const newRemainingFees = Math.max(0, existing.remainingFees - amountDiff);

    const updateData: Record<string, unknown> = {};
    if (request.amountPaid !== undefined) updateData.amountPaid = request.amountPaid;
    if (request.narration !== undefined) updateData.narration = request.narration;
    if (request.amountDate !== undefined) updateData.paymentDate = new Date(request.amountDate);
    if (request.lateFees !== undefined) updateData.lateFees = request.lateFees;
    if (request.receiptNumber !== undefined) updateData.receiptNumber = request.receiptNumber;
    if (amountDiff !== 0) updateData.remainingFees = newRemainingFees;

    const updated = await this.feeRepo.update(request.tenantId, request.feeId, updateData as any);

    // Update student totals if amount changed
    if (amountDiff !== 0) {
      await StudentModel.findOneAndUpdate(
        { _id: existing.studentId, tenantId: request.tenantId },
        {
          $inc: {
            'enrollment.totalPaid': amountDiff,
            'enrollment.remainingFees': -amountDiff,
          },
        },
      ).exec();
    }

    return {
      id: updated.id,
      studentId: updated.studentId,
      courseId: updated.courseId,
      netCourseFees: updated.netCourseFees,
      remainingFees: updated.remainingFees,
      amountPaid: updated.amountPaid,
      receiptNumber: updated.receiptNumber,
      paymentMethod: updated.paymentMethod,
      narration: updated.narration,
      lateFees: updated.lateFees,
      gstPercentage: updated.gstPercentage,
      paymentDate: updated.paymentDate,
      updatedAt: updated.updatedAt,
    };
  }
}
