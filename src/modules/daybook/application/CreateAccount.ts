import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';
import { DayBookAccount } from '../domain/entities/DayBookAccount.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateAccountRequest {
  tenantId: string;
  accountName: string;
  accountId?: string;
  accountType: string;
  isActive?: boolean;
}

export interface CreateAccountResponse {
  id: string;
  accountName: string;
  accountId: string;
  accountType: string;
  isActive: boolean;
  createdAt: Date;
}

export class CreateAccount implements UseCase<CreateAccountRequest, CreateAccountResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: CreateAccountRequest): Promise<CreateAccountResponse> {
    const { accounts } = await this.repo.findAllAccounts(request.tenantId, {
      search: request.accountName,
      limit: 1,
    });
    const duplicate = accounts.find(
      (a) => a.accountName.toLowerCase() === request.accountName.toLowerCase(),
    );
    if (duplicate) {
      throw new ConflictError(`Account with name "${request.accountName}" already exists`);
    }

    const account = DayBookAccount.create({
      tenantId: request.tenantId,
      accountName: request.accountName,
      accountId: request.accountId,
      accountType: request.accountType,
      isActive: request.isActive,
    });

    const saved = await this.repo.saveAccount(account);

    return {
      id: saved.id,
      accountName: saved.accountName,
      accountId: saved.accountId,
      accountType: saved.accountType,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
