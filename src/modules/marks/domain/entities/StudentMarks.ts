import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { ValidationError } from '../../../../shared/domain/errors.js';

export interface SubjectMark {
  subjectName: string;
  subjectCode: string;
  theory: number | null;
  practical: number | null;
  totalMarks: number | null;
  isActive: boolean;
}

export type ResultStatus = 'NotStarted' | 'InProgress' | 'Completed';

interface StudentMarksProps {
  tenantId: string;
  studentId: string;
  courseId: string;
  subjects: SubjectMark[];
  resultStatus: ResultStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentMarksInput {
  tenantId: string;
  studentId: string;
  courseId: string;
  subjects?: SubjectMark[];
  resultStatus?: ResultStatus;
}

export class StudentMarks extends AggregateRoot<StudentMarksProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get courseId(): string {
    return this.props.courseId;
  }
  get subjects(): SubjectMark[] {
    return this.props.subjects;
  }
  get resultStatus(): ResultStatus {
    return this.props.resultStatus;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateSubjectMarks(subjectName: string, theory: number | null, practical: number | null): void {
    const subject = this.props.subjects.find((s) => s.subjectName === subjectName);
    if (!subject) {
      throw new ValidationError(`Subject ${subjectName} not found`);
    }
    subject.theory = theory;
    subject.practical = practical;
    subject.totalMarks = this.calculateTotal(theory, practical);
    this.props.updatedAt = new Date();
  }

  updateSubjects(subjects: SubjectMark[]): void {
    this.props.subjects = subjects;
    this.props.updatedAt = new Date();
  }

  setResultStatus(status: ResultStatus): void {
    this.props.resultStatus = status;
    this.props.updatedAt = new Date();
  }

  calculateTotal(theory: number | null, practical: number | null): number | null {
    if (theory === null && practical === null) return null;
    return (theory ?? 0) + (practical ?? 0);
  }

  static create(input: CreateStudentMarksInput, id?: string): StudentMarks {
    return new StudentMarks(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        courseId: input.courseId,
        subjects: input.subjects ?? [],
        resultStatus: input.resultStatus ?? 'NotStarted',
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
      subjects: SubjectMark[];
      resultStatus: ResultStatus;
      createdAt: Date;
      updatedAt: Date;
    },
  ): StudentMarks {
    return new StudentMarks(props, id);
  }
}
