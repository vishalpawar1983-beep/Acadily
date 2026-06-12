import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentOptionRepository } from '../domain/repositories/IPaymentOptionRepository.js';
import { NotFoundError, ConflictError } from '../../../shared/domain/errors.js';

export interface UpdatePaymentOptionRequest {
  tenantId: string;
  paymentOptionId: string;
  name?: string;
  isActive?: boolean;
}

export interface UpdatePaymentOptionResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdBy: string;
  updatedAt: Date;
}

export class UpdatePaymentOption implements UseCase<UpdatePaymentOptionRequest, UpdatePaymentOptionResponse> {
  constructor(private readonly repo: IPaymentOptionRepository) {}

  async execute(request: UpdatePaymentOptionRequest): Promise<UpdatePaymentOptionResponse> {
    const option = await this.repo.findById(request.tenantId, request.paymentOptionId);
    if (!option) {
      throw new NotFoundError('PaymentOption', request.paymentOptionId);
    }

    if (request.name && request.name !== option.name) {
      const existing = await this.repo.findByName(request.tenantId, request.name);
      if (existing) {
        throw new ConflictError(`Payment option with name "${request.name}" already exists`);
      }
    }

    option.updateDetails({
      name: request.name,
      isActive: request.isActive,
    });

    const updated = await this.repo.update(option);

    return {
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
      createdBy: updated.createdBy,
      updatedAt: updated.updatedAt,
    };
  }
}
