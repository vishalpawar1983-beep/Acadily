import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface DeleteAccountRequest {
  tenantId: string;
  accountId: string;
}

export interface DeleteAccountResponse {
  success: boolean;
}

export class DeleteAccount implements UseCase<DeleteAccountRequest, DeleteAccountResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    const account = await this.repo.findAccountById(request.tenantId, request.accountId);
    if (!account) {
      throw new NotFoundError('DayBookAccount', request.accountId);
    }

    await this.repo.deleteAccount(request.tenantId, request.accountId);

    return { success: true };
  }
}
