import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IDayBookRepository } from '../domain/repositories/IDayBookRepository.js';
import { DayBookEntry } from '../domain/entities/DayBookEntry.js';

export interface CreateEntryRequest {
  tenantId: string;
  accountId: string;
  accountName?: string;
  accountType?: string;
  companyId?: string;
  date?: string;
  narration: string;
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

export interface CreateEntryResponse {
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
}

export class CreateEntry implements UseCase<CreateEntryRequest, CreateEntryResponse> {
  constructor(private readonly repo: IDayBookRepository) {}

  async execute(request: CreateEntryRequest): Promise<CreateEntryResponse> {
    const entry = DayBookEntry.create({
      tenantId: request.tenantId,
      accountId: request.accountId,
      accountName: request.accountName,
      accountType: request.accountType,
      companyId: request.companyId,
      date: request.date,
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

    const saved = await this.repo.saveEntry(entry);

    return {
      id: saved.id,
      accountId: saved.accountId,
      accountName: saved.accountName,
      accountType: saved.accountType,
      companyId: saved.companyId,
      date: saved.date,
      narration: saved.narration,
      debit: saved.debit,
      credit: saved.credit,
      balance: saved.balance,
      studentId: saved.studentId,
      studentName: saved.studentName,
      rollNumber: saved.rollNumber,
      receiptNumber: saved.receiptNumber,
      linkAccountId: saved.linkAccountId,
      linkAccountName: saved.linkAccountName,
      linkAccountType: saved.linkAccountType,
      linkDayBookAccountData: saved.linkDayBookAccountData,
      createdAt: saved.createdAt,
    };
  }
}
