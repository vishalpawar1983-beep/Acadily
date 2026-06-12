import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface DayBookAccountProps {
  tenantId: string;
  accountName: string;
  accountId: string;
  accountType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDayBookAccountInput {
  tenantId: string;
  accountName: string;
  accountId?: string;
  accountType: string;
  isActive?: boolean;
}

export class DayBookAccount extends AggregateRoot<DayBookAccountProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get accountName(): string {
    return this.props.accountName;
  }
  get accountId(): string {
    return this.props.accountId;
  }
  get accountType(): string {
    return this.props.accountType;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    accountName?: string;
    accountId?: string;
    accountType?: string;
    isActive?: boolean;
  }): void {
    if (input.accountName !== undefined) this.props.accountName = input.accountName;
    if (input.accountId !== undefined) this.props.accountId = input.accountId;
    if (input.accountType !== undefined) this.props.accountType = input.accountType;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateDayBookAccountInput, id?: string): DayBookAccount {
    return new DayBookAccount(
      {
        tenantId: input.tenantId,
        accountName: input.accountName,
        accountId: input.accountId ?? '',
        accountType: input.accountType,
        isActive: input.isActive ?? true,
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
      accountName: string;
      accountId: string;
      accountType: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): DayBookAccount {
    return new DayBookAccount(props, id);
  }
}
