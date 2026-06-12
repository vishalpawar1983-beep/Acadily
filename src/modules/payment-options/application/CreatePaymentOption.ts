import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentOptionRepository } from '../domain/repositories/IPaymentOptionRepository.js';
import { PaymentOption } from '../domain/entities/PaymentOption.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreatePaymentOptionRequest {
  tenantId: string;
  name: string;
  isActive?: boolean;
  createdBy: string;
}

export interface CreatePaymentOptionResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export class CreatePaymentOption implements UseCase<CreatePaymentOptionRequest, CreatePaymentOptionResponse> {
  constructor(private readonly repo: IPaymentOptionRepository) {}

  async execute(request: CreatePaymentOptionRequest): Promise<CreatePaymentOptionResponse> {
    const existing = await this.repo.findByName(request.tenantId, request.name);
    if (existing) {
      throw new ConflictError(`Payment option with name "${request.name}" already exists`);
    }

    const option = PaymentOption.create({
      tenantId: request.tenantId,
      name: request.name,
      isActive: request.isActive,
      createdBy: request.createdBy,
    });

    const saved = await this.repo.save(option);

    return {
      id: saved.id,
      name: saved.name,
      isActive: saved.isActive,
      createdBy: saved.createdBy,
      createdAt: saved.createdAt,
    };
  }
}
