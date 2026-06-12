import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetAccountRequest {
  tenantId: string;
  accountId: string;
}

export interface GetAccountResponse {
  id: string;
  accountName: string;
  accountId: string;
  accountType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetAccount implements UseCase<GetAccountRequest, GetAccountResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: GetAccountRequest): Promise<GetAccountResponse> {
    const account = await this.repo.findAccountById(request.tenantId, request.accountId);
    if (!account) {
      throw new NotFoundError('DayBookAccount', request.accountId);
    }

    return {
      id: account.id,
      accountName: account.accountName,
      accountId: account.accountId,
      accountType: account.accountType,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
