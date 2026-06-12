import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IPaymentOptionRepository } from '../domain/repositories/IPaymentOptionRepository.js';

export interface ListPaymentOptionsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface ListPaymentOptionsResponse {
  paymentOptions: Array<{
    id: string;
    name: string;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListPaymentOptions implements UseCase<ListPaymentOptionsRequest, ListPaymentOptionsResponse> {
  constructor(private readonly repo: IPaymentOptionRepository) {}

  async execute(request: ListPaymentOptionsRequest): Promise<ListPaymentOptionsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { paymentOptions, total } = await this.repo.findAll(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
      search: request.search,
    });

    return {
      paymentOptions: paymentOptions.map((p) => ({
        id: p.id,
        name: p.name,
        isActive: p.isActive,
        createdBy: p.createdBy,
        createdAt: p.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
