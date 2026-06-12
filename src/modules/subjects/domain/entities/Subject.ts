import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface SubjectProps {
  tenantId: string;
  subjectName: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  semYear: string;
  courseId: string;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubjectInput {
  tenantId: string;
  subjectName: string;
  subjectCode: string;
  fullMarks: number;
  passMarks: number;
  semYear: string;
  courseId: string;
  addedBy: string;
}

export class Subject extends AggregateRoot<SubjectProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get subjectName(): string {
    return this.props.subjectName;
  }
  get subjectCode(): string {
    return this.props.subjectCode;
  }
  get fullMarks(): number {
    return this.props.fullMarks;
  }
  get passMarks(): number {
    return this.props.passMarks;
  }
  get semYear(): string {
    return this.props.semYear;
  }
  get courseId(): string {
    return this.props.courseId;
  }
  get addedBy(): string {
    return this.props.addedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(updates: {
    subjectName?: string;
    subjectCode?: string;
    fullMarks?: number;
    passMarks?: number;
    semYear?: string;
    courseId?: string;
  }): void {
    if (updates.subjectName !== undefined) this.props.subjectName = updates.subjectName;
    if (updates.subjectCode !== undefined) this.props.subjectCode = updates.subjectCode;
    if (updates.fullMarks !== undefined) this.props.fullMarks = updates.fullMarks;
    if (updates.passMarks !== undefined) this.props.passMarks = updates.passMarks;
    if (updates.semYear !== undefined) this.props.semYear = updates.semYear;
    if (updates.courseId !== undefined) this.props.courseId = updates.courseId;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateSubjectInput, id?: string): Subject {
    return new Subject(
      {
        tenantId: input.tenantId,
        subjectName: input.subjectName,
        subjectCode: input.subjectCode,
        fullMarks: input.fullMarks,
        passMarks: input.passMarks,
        semYear: input.semYear,
        courseId: input.courseId,
        addedBy: input.addedBy,
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
      subjectName: string;
      subjectCode: string;
      fullMarks: number;
      passMarks: number;
      semYear: string;
      courseId: string;
      addedBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Subject {
    return new Subject(props, id);
  }
}
