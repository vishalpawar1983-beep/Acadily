import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetEntryRequest {
  tenantId: string;
  entryId: string;
}

export interface GetEntryResponse {
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
  updatedAt: Date;
}

export class GetEntry implements UseCase<GetEntryRequest, GetEntryResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: GetEntryRequest): Promise<GetEntryResponse> {
    const entry = await this.repo.findEntryById(request.tenantId, request.entryId);
    if (!entry) {
      throw new NotFoundError('DayBookEntry', request.entryId);
    }

    return {
      id: entry.id,
      accountId: entry.accountId,
      accountName: entry.accountName,
      accountType: entry.accountType,
      companyId: entry.companyId,
      date: entry.date,
      narration: entry.narration,
      debit: entry.debit,
      credit: entry.credit,
      balance: entry.balance,
      studentId: entry.studentId,
      studentName: entry.studentName,
      rollNumber: entry.rollNumber,
      receiptNumber: entry.receiptNumber,
      linkAccountId: entry.linkAccountId,
      linkAccountName: entry.linkAccountName,
      linkAccountType: entry.linkAccountType,
      linkDayBookAccountData: entry.linkDayBookAccountData,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }
}
