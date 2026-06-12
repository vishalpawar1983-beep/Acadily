import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface NumberOfYearsProps {
  tenantId: string;
  value: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNumberOfYearsInput {
  tenantId: string;
  value: number;
  createdBy: string;
}

export class NumberOfYears extends AggregateRoot<NumberOfYearsProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get value(): number {
    return this.props.value;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: { value?: number }): void {
    if (input.value !== undefined) this.props.value = input.value;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateNumberOfYearsInput, id?: string): NumberOfYears {
    return new NumberOfYears(
      {
        tenantId: input.tenantId,
        value: input.value,
        createdBy: input.createdBy,
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
      value: number;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): NumberOfYears {
    return new NumberOfYears(props, id);
  }
}
