import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface ReceiptCounterProps {
  tenantId: string;
  prefix: string;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReceiptCounterInput {
  tenantId: string;
  prefix: string;
  currentValue?: number;
}

export class ReceiptCounter extends AggregateRoot<ReceiptCounterProps> {
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

  nextNumber(): string {
    this.props.currentValue += 1;
    this.props.updatedAt = new Date();
    return `${this.props.prefix}-${this.props.currentValue}`;
  }

  updatePrefix(prefix: string): void {
    this.props.prefix = prefix;
    this.props.updatedAt = new Date();
  }

  resetCounter(value: number): void {
    this.props.currentValue = value;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateReceiptCounterInput, id?: string): ReceiptCounter {
    return new ReceiptCounter(
      {
        tenantId: input.tenantId,
        prefix: input.prefix,
        currentValue: input.currentValue ?? 100,
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
  ): ReceiptCounter {
    return new ReceiptCounter(props, id);
  }
}
