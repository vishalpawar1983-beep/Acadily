import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface PaymentOptionProps {
  tenantId: string;
  name: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentOptionInput {
  tenantId: string;
  name: string;
  isActive?: boolean;
  createdBy: string;
}

export class PaymentOption extends AggregateRoot<PaymentOptionProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get isActive(): boolean {
    return this.props.isActive;
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

  updateDetails(input: {
    name?: string;
    isActive?: boolean;
  }): void {
    if (input.name !== undefined) this.props.name = input.name;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreatePaymentOptionInput, id?: string): PaymentOption {
    return new PaymentOption(
      {
        tenantId: input.tenantId,
        name: input.name,
        isActive: input.isActive ?? true,
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
      name: string;
      isActive: boolean;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): PaymentOption {
    return new PaymentOption(props, id);
  }
}
