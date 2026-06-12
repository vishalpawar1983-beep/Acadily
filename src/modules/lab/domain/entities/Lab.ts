import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface LabProps {
  tenantId: string;
  labName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabInput {
  tenantId: string;
  labName: string;
  isActive?: boolean;
}

export class Lab extends AggregateRoot<LabProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get labName(): string {
    return this.props.labName;
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

  updateDetails(input: { labName?: string; isActive?: boolean }): void {
    if (input.labName !== undefined) this.props.labName = input.labName;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateLabInput, id?: string): Lab {
    return new Lab(
      {
        tenantId: input.tenantId,
        labName: input.labName,
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
      labName: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Lab {
    return new Lab(props, id);
  }
}
