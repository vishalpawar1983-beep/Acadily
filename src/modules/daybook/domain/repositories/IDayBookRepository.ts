import { DayBookAccount } from '../entities/DayBookAccount.js';
import { DayBookEntry } from '../entities/DayBookEntry.js';

export interface FindAllEntriesOptions {
  skip?: number;
  limit?: number;
  accountId?: string;
  search?: string;
}

export interface FindAllAccountsOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface IDayBookRepository {
  // Accounts
  findAccountById(tenantId: string, id: string): Promise<DayBookAccount | null>;
  findAllAccounts(
    tenantId: string,
    options?: FindAllAccountsOptions,
  ): Promise<{ accounts: DayBookAccount[]; total: number }>;
  saveAccount(account: DayBookAccount): Promise<DayBookAccount>;
  updateAccount(account: DayBookAccount): Promise<DayBookAccount>;
  deleteAccount(tenantId: string, id: string): Promise<void>;

  // Entries
  findEntryById(tenantId: string, id: string): Promise<DayBookEntry | null>;
  findAllEntries(
    tenantId: string,
    options?: FindAllEntriesOptions,
  ): Promise<{ entries: DayBookEntry[]; total: number }>;
  saveEntry(entry: DayBookEntry): Promise<DayBookEntry>;
  updateEntry(entry: DayBookEntry): Promise<DayBookEntry>;
  deleteEntry(tenantId: string, id: string): Promise<void>;
}
