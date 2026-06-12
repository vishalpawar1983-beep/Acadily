import { DayBookAccount } from '../domain/entities/DayBookAccount.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { DayBookEntry } from '../domain/entities/DayBookEntry.js';
import type {
  IDayBookRepository,
  FindAllAccountsOptions,
  FindAllEntriesOptions,
} from '../domain/repositories/IDayBookRepository.js';
import {
  DayBookAccountModel,
  DayBookEntryModel,
  type IDayBookAccountDocument,
  type IDayBookEntryDocument,
} from './DayBookModel.js';

export class MongoDayBookRepository implements IDayBookRepository {
  // ── Accounts ──────────────────────────────────────────────

  async findAccountById(tenantId: string, id: string): Promise<DayBookAccount | null> {
    const doc = await DayBookAccountModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toAccountDomain(doc) : null;
  }

  async findAllAccounts(
    tenantId: string,
    options: FindAllAccountsOptions = {},
  ): Promise<{ accounts: DayBookAccount[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;
    if (options.search) {
      filter.$or = [
        { accountName: { $regex: options.search, $options: 'i' } },
        { accountType: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      DayBookAccountModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      DayBookAccountModel.countDocuments(filter).exec(),
    ]);

    return { accounts: docs.map((d) => this.toAccountDomain(d)), total };
  }

  async saveAccount(account: DayBookAccount): Promise<DayBookAccount> {
    const doc = await DayBookAccountModel.create({
      _id: account.id,
      tenantId: account.tenantId,
      accountName: account.accountName,
      accountId: account.accountId,
      accountType: account.accountType,
      isActive: account.isActive,
    });
    return this.toAccountDomain(doc);
  }

  async updateAccount(account: DayBookAccount): Promise<DayBookAccount> {
    const doc = await DayBookAccountModel.findOneAndUpdate(
      { _id: account.id, tenantId: account.tenantId },
      {
        accountName: account.accountName,
        accountId: account.accountId,
        accountType: account.accountType,
        isActive: account.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('DayBookAccount', account.id);
    return this.toAccountDomain(doc);
  }

  async deleteAccount(tenantId: string, id: string): Promise<void> {
    await DayBookAccountModel.deleteOne({ _id: id, tenantId }).exec();
  }

  // ── Entries ───────────────────────────────────────────────

  async findEntryById(tenantId: string, id: string): Promise<DayBookEntry | null> {
    const doc = await DayBookEntryModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toEntryDomain(doc) : null;
  }

  async findAllEntries(
    tenantId: string,
    options: FindAllEntriesOptions = {},
  ): Promise<{ entries: DayBookEntry[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.accountId) filter.accountId = options.accountId;
    if (options.search) {
      filter.$or = [
        { narration: { $regex: options.search, $options: 'i' } },
        { studentName: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      DayBookEntryModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ date: -1 })
        .exec(),
      DayBookEntryModel.countDocuments(filter).exec(),
    ]);

    return { entries: docs.map((d) => this.toEntryDomain(d)), total };
  }

  async saveEntry(entry: DayBookEntry): Promise<DayBookEntry> {
    const doc = await DayBookEntryModel.create({
      _id: entry.id,
      tenantId: entry.tenantId,
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
    });
    return this.toEntryDomain(doc);
  }

  async updateEntry(entry: DayBookEntry): Promise<DayBookEntry> {
    const doc = await DayBookEntryModel.findOneAndUpdate(
      { _id: entry.id, tenantId: entry.tenantId },
      {
        accountId: entry.accountId,
        accountName: entry.accountName,
        accountType: entry.accountType,
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
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('DayBookEntry', entry.id);
    return this.toEntryDomain(doc);
  }

  async deleteEntry(tenantId: string, id: string): Promise<void> {
    await DayBookEntryModel.deleteOne({ _id: id, tenantId }).exec();
  }

  // ── Mappers ───────────────────────────────────────────────

  private toAccountDomain(doc: IDayBookAccountDocument): DayBookAccount {
    return DayBookAccount.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      accountName: doc.accountName,
      accountId: doc.accountId,
      accountType: doc.accountType,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toEntryDomain(doc: IDayBookEntryDocument): DayBookEntry {
    return DayBookEntry.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      accountId: doc.accountId,
      accountName: doc.accountName ?? '',
      accountType: doc.accountType ?? '',
      companyId: doc.companyId ?? '',
      date: doc.date,
      narration: doc.narration,
      debit: doc.debit,
      credit: doc.credit,
      balance: doc.balance,
      studentId: doc.studentId,
      studentName: doc.studentName,
      rollNumber: doc.rollNumber,
      receiptNumber: doc.receiptNumber,
      linkAccountId: doc.linkAccountId,
      linkAccountName: doc.linkAccountName ?? '',
      linkAccountType: doc.linkAccountType,
      linkDayBookAccountData: doc.linkDayBookAccountData ?? '',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
