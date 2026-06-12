import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface UpdateEntryRequest {
  tenantId: string;
  entryId: string;
  accountId?: string;
  accountName?: string;
  accountType?: string;
  date?: string;
  narration?: string;
  debit?: number;
  credit?: number;
  balance?: number;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  receiptNumber?: string;
  linkAccountId?: string;
  linkAccountName?: string;
  linkAccountType?: string;
  linkDayBookAccountData?: string;
}

export interface UpdateEntryResponse {
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
  updatedAt: Date;
}

export class UpdateEntry implements UseCase<UpdateEntryRequest, UpdateEntryResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: UpdateEntryRequest): Promise<UpdateEntryResponse> {
    const entry = await this.repo.findEntryById(request.tenantId, request.entryId);
    if (!entry) {
      throw new NotFoundError('DayBookEntry', request.entryId);
    }

    entry.updateDetails({
      accountId: request.accountId,
      accountName: request.accountName,
      accountType: request.accountType,
      date: request.date ? new Date(request.date) : undefined,
      narration: request.narration,
      debit: request.debit,
      credit: request.credit,
      balance: request.balance,
      studentId: request.studentId,
      studentName: request.studentName,
      rollNumber: request.rollNumber,
      receiptNumber: request.receiptNumber,
      linkAccountId: request.linkAccountId,
      linkAccountName: request.linkAccountName,
      linkAccountType: request.linkAccountType,
      linkDayBookAccountData: request.linkDayBookAccountData,
    });

    const updated = await this.repo.updateEntry(entry);

    return {
      id: updated.id,
      accountId: updated.accountId,
      accountName: updated.accountName,
      accountType: updated.accountType,
      companyId: updated.companyId,
      date: updated.date,
      narration: updated.narration,
      debit: updated.debit,
      credit: updated.credit,
      balance: updated.balance,
      studentId: updated.studentId,
      studentName: updated.studentName,
      rollNumber: updated.rollNumber,
      receiptNumber: updated.receiptNumber,
      linkAccountId: updated.linkAccountId,
      linkAccountName: updated.linkAccountName,
      linkAccountType: updated.linkAccountType,
      linkDayBookAccountData: updated.linkDayBookAccountData,
      updatedAt: updated.updatedAt,
    };
  }
}
