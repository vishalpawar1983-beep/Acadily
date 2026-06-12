import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface DayBookEntryProps {
  tenantId: string;
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

export interface CreateDayBookEntryInput {
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

export class DayBookEntry extends AggregateRoot<DayBookEntryProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get accountId(): string {
    return this.props.accountId;
  }
  get accountName(): string {
    return this.props.accountName;
  }
  get accountType(): string {
    return this.props.accountType;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get date(): Date {
    return this.props.date;
  }
  get narration(): string {
    return this.props.narration;
  }
  get debit(): number {
    return this.props.debit;
  }
  get credit(): number {
    return this.props.credit;
  }
  get balance(): number {
    return this.props.balance;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get studentName(): string {
    return this.props.studentName;
  }
  get rollNumber(): string {
    return this.props.rollNumber;
  }
  get receiptNumber(): string {
    return this.props.receiptNumber;
  }
  get linkAccountId(): string {
    return this.props.linkAccountId;
  }
  get linkAccountName(): string {
    return this.props.linkAccountName;
  }
  get linkAccountType(): string {
    return this.props.linkAccountType;
  }
  get linkDayBookAccountData(): string {
    return this.props.linkDayBookAccountData;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    accountId?: string;
    accountName?: string;
    accountType?: string;
    date?: Date;
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
  }): void {
    if (input.accountId !== undefined) this.props.accountId = input.accountId;
    if (input.accountName !== undefined) this.props.accountName = input.accountName;
    if (input.accountType !== undefined) this.props.accountType = input.accountType;
    if (input.date !== undefined) this.props.date = input.date;
    if (input.narration !== undefined) this.props.narration = input.narration;
    if (input.debit !== undefined) this.props.debit = input.debit;
    if (input.credit !== undefined) this.props.credit = input.credit;
    if (input.balance !== undefined) this.props.balance = input.balance;
    if (input.studentId !== undefined) this.props.studentId = input.studentId;
    if (input.studentName !== undefined) this.props.studentName = input.studentName;
    if (input.rollNumber !== undefined) this.props.rollNumber = input.rollNumber;
    if (input.receiptNumber !== undefined) this.props.receiptNumber = input.receiptNumber;
    if (input.linkAccountId !== undefined) this.props.linkAccountId = input.linkAccountId;
    if (input.linkAccountName !== undefined) this.props.linkAccountName = input.linkAccountName;
    if (input.linkAccountType !== undefined) this.props.linkAccountType = input.linkAccountType;
    if (input.linkDayBookAccountData !== undefined) this.props.linkDayBookAccountData = input.linkDayBookAccountData;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateDayBookEntryInput, id?: string): DayBookEntry {
    return new DayBookEntry(
      {
        tenantId: input.tenantId,
        accountId: input.accountId,
        accountName: input.accountName ?? '',
        accountType: input.accountType ?? '',
        companyId: input.companyId ?? '',
        date: input.date ? new Date(input.date) : new Date(),
        narration: input.narration,
        debit: input.debit ?? 0,
        credit: input.credit ?? 0,
        balance: input.balance ?? 0,
        studentId: input.studentId ?? '',
        studentName: input.studentName ?? '',
        rollNumber: input.rollNumber ?? '',
        receiptNumber: input.receiptNumber ?? '',
        linkAccountId: input.linkAccountId ?? '',
        linkAccountName: input.linkAccountName ?? '',
        linkAccountType: input.linkAccountType ?? '',
        linkDayBookAccountData: input.linkDayBookAccountData ?? '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(
    id: string,
    props: {
      tenantId: string;
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
    },
  ): DayBookEntry {
    return new DayBookEntry(props, id);
  }
}
