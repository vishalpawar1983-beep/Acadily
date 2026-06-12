import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';

export interface ListEntriesRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  accountId?: string;
  search?: string;
}

export interface ListEntriesResponse {
  entries: Array<{
    id: string;
    accountId: string;
    accountName: string;
    accountType: string;
    companyId: string;
    date: Date;
    narration: string;
    debit: number;
    credit: number;
    balance: number;
    studentId: string;
    studentName: string;
    rollNumber: string;
    receiptNumber: string;
    linkAccountId: string;
    linkAccountName: string;
    linkAccountType: string;
    linkDayBookAccountData: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListEntries implements UseCase<ListEntriesRequest, ListEntriesResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: ListEntriesRequest): Promise<ListEntriesResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { entries, total } = await this.repo.findAllEntries(request.tenantId, {
      skip,
      limit,
      accountId: request.accountId,
      search: request.search,
    });

    return {
      entries: entries.map((e) => ({
        id: e.id,
        accountId: e.accountId,
        accountName: e.accountName,
        accountType: e.accountType,
        companyId: e.companyId,
        date: e.date,
        narration: e.narration,
        debit: e.debit,
        credit: e.credit,
        balance: e.balance,
        studentId: e.studentId,
        studentName: e.studentName,
        rollNumber: e.rollNumber,
        receiptNumber: e.receiptNumber,
        linkAccountId: e.linkAccountId,
        linkAccountName: e.linkAccountName,
        linkAccountType: e.linkAccountType,
        linkDayBookAccountData: e.linkDayBookAccountData,
        createdAt: e.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
