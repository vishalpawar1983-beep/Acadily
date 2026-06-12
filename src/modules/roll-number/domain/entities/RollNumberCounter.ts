import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface RollNumberCounterProps {
  tenantId: string;
  prefix: string;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRollNumberCounterInput {
  tenantId: string;
  prefix?: string;
  currentValue?: number;
}

export class RollNumberCounter extends AggregateRoot<RollNumberCounterProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get prefix(): string {
    return this.props.prefix;
  }
  get currentValue(): number {
    return this.props.currentValue;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get formattedValue(): string {
    return `${this.props.prefix}${this.props.currentValue}`;
  }

  updateDetails(input: { prefix?: string; currentValue?: number }): void {
    if (input.prefix !== undefined) this.props.prefix = input.prefix;
    if (input.currentValue !== undefined) this.props.currentValue = input.currentValue;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateRollNumberCounterInput, id?: string): RollNumberCounter {
    return new RollNumberCounter(
      {
        tenantId: input.tenantId,
        prefix: input.prefix ?? '',
        currentValue: input.currentValue ?? 1000,
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
      prefix: string;
      currentValue: number;
      createdAt: Date;
      updatedAt: Date;
    },
  ): RollNumberCounter {
    return new RollNumberCounter(props, id);
  }
}
