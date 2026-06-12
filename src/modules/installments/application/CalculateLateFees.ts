import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeInstallmentRepository } from '../domain/repositories/IFeeInstallmentRepository.js';

export interface CalculateLateFeesRequest {
  tenantId: string;
  lateFeeAmount: number;
  frequency: 'daily' | 'monthly';
}

export interface CalculateLateFeesResponse {
  processed: number;
  totalLateFees: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class CalculateLateFees implements UseCase<CalculateLateFeesRequest, CalculateLateFeesResponse> {
  constructor(private readonly installmentRepo: IFeeInstallmentRepository) {}

  async execute(request: CalculateLateFeesRequest): Promise<CalculateLateFeesResponse> {
    const overdueInstallments = await this.installmentRepo.findOverdue(request.tenantId);

    let totalLateFees = 0;
    const now = new Date();

    for (const installment of overdueInstallments) {
      let lateFee: number;

      if (request.frequency === 'daily') {
        // Legacy pattern: Rs. X per overdue day
        const daysOverdue = Math.floor(
          (now.getTime() - installment.dueDate.getTime()) / MS_PER_DAY,
        );
        lateFee = request.lateFeeAmount * Math.max(daysOverdue, 0);
      } else {
        // Monthly: Rs. X per overdue month
        const monthsOverdue = installment.calculateMonthsOverdue();
        lateFee = request.lateFeeAmount * monthsOverdue;
      }

      installment.applyLateFee(lateFee);
      await this.installmentRepo.update(installment);

      totalLateFees += lateFee;
    }

    return {
      processed: overdueInstallments.length,
      totalLateFees,
    };
  }
}
