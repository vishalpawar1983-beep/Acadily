import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface TimingProps {
  tenantId: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimingInput {
  tenantId: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export class Timing extends AggregateRoot<TimingProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get startTime(): string {
    return this.props.startTime;
  }
  get endTime(): string {
    return this.props.endTime;
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

  updateDetails(input: { startTime?: string; endTime?: string; isActive?: boolean }): void {
    if (input.startTime !== undefined) this.props.startTime = input.startTime;
    if (input.endTime !== undefined) this.props.endTime = input.endTime;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateTimingInput, id?: string): Timing {
    return new Timing(
      {
        tenantId: input.tenantId,
        startTime: input.startTime,
        endTime: input.endTime,
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
      startTime: string;
      endTime: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Timing {
    return new Timing(props, id);
  }
}
