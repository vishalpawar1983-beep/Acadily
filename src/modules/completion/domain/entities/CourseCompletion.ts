import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export type CompletionStatus = 'completed' | 'withdrawn' | 'failed';

interface CourseCompletionProps {
  tenantId: string;
  studentId: string;
  courseId: string;
  completionDate: Date;
  certificateNumber: string | null;
  remarks: string | null;
  status: CompletionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseCompletionInput {
  tenantId: string;
  studentId: string;
  courseId: string;
  completionDate?: string;
  certificateNumber?: string;
  remarks?: string;
  status?: CompletionStatus;
}

export class CourseCompletion extends AggregateRoot<CourseCompletionProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get courseId(): string {
    return this.props.courseId;
  }
  get completionDate(): Date {
    return this.props.completionDate;
  }
  get certificateNumber(): string | null {
    return this.props.certificateNumber;
  }
  get remarks(): string | null {
    return this.props.remarks;
  }
  get status(): CompletionStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    completionDate?: Date;
    certificateNumber?: string;
    remarks?: string;
    status?: CompletionStatus;
  }): void {
    if (input.completionDate !== undefined) this.props.completionDate = input.completionDate;
    if (input.certificateNumber !== undefined) this.props.certificateNumber = input.certificateNumber;
    if (input.remarks !== undefined) this.props.remarks = input.remarks;
    if (input.status !== undefined) this.props.status = input.status;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateCourseCompletionInput, id?: string): CourseCompletion {
    return new CourseCompletion(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        courseId: input.courseId,
        completionDate: input.completionDate ? new Date(input.completionDate) : new Date(),
        certificateNumber: input.certificateNumber ?? null,
        remarks: input.remarks ?? null,
        status: input.status ?? 'completed',
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
      studentId: string;
      courseId: string;
      completionDate: Date;
      certificateNumber: string | null;
      remarks: string | null;
      status: CompletionStatus;
      createdAt: Date;
      updatedAt: Date;
    },
  ): CourseCompletion {
    return new CourseCompletion(props, id);
  }
}
