import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';

export interface ListAccountsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface ListAccountsResponse {
  accounts: Array<{
    id: string;
    accountName: string;
    accountId: string;
    accountType: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListAccounts implements UseCase<ListAccountsRequest, ListAccountsResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: ListAccountsRequest): Promise<ListAccountsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { accounts, total } = await this.repo.findAllAccounts(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
      search: request.search,
    });

    return {
      accounts: accounts.map((a) => ({
        id: a.id,
        accountName: a.accountName,
        accountId: a.accountId,
        accountType: a.accountType,
        isActive: a.isActive,
        createdAt: a.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
