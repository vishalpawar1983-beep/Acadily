import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentOptionRepository } from '../domain/repositories/IPaymentOptionRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeletePaymentOptionRequest {
  tenantId: string;
  paymentOptionId: string;
}

export interface DeletePaymentOptionResponse {
  success: boolean;
}

export class DeletePaymentOption implements UseCase<DeletePaymentOptionRequest, DeletePaymentOptionResponse> {
  constructor(private readonly repo: IPaymentOptionRepository) {}

  async execute(request: DeletePaymentOptionRequest): Promise<DeletePaymentOptionResponse> {
    const option = await this.repo.findById(request.tenantId, request.paymentOptionId);
    if (!option) {
      throw new NotFoundError('PaymentOption', request.paymentOptionId);
    }

    await this.repo.delete(request.tenantId, request.paymentOptionId);

    return { success: true };
  }
}
