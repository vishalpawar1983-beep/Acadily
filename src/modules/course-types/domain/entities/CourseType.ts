import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface CourseTypeProps {
  tenantId: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseTypeInput {
  tenantId: string;
  name: string;
  createdBy: string;
}

export class CourseType extends AggregateRoot<CourseTypeProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
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

  updateDetails(input: { name?: string }): void {
    if (input.name !== undefined) this.props.name = input.name;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateCourseTypeInput, id?: string): CourseType {
    return new CourseType(
      {
        tenantId: input.tenantId,
        name: input.name,
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
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): CourseType {
    return new CourseType(props, id);
  }
}
