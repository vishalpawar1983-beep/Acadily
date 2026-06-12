import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface TrainerProps {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrainerInput {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  isActive?: boolean;
  createdBy: string;
}

export class Trainer extends AggregateRoot<TrainerProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get specialization(): string | undefined {
    return this.props.specialization;
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
    email?: string;
    phone?: string;
    specialization?: string;
    isActive?: boolean;
  }): void {
    if (input.name !== undefined) this.props.name = input.name;
    if (input.email !== undefined) this.props.email = input.email;
    if (input.phone !== undefined) this.props.phone = input.phone;
    if (input.specialization !== undefined) this.props.specialization = input.specialization;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateTrainerInput, id?: string): Trainer {
    return new Trainer(
      {
        tenantId: input.tenantId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        specialization: input.specialization,
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
      email?: string;
      phone?: string;
      specialization?: string;
      isActive: boolean;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Trainer {
    return new Trainer(props, id);
  }
}
