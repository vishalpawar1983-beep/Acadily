import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface AdmissionFormProps {
  tenantId: string;
  studentId: string;
  formData: Record<string, unknown>;
  companyId: string;
  showNotesDashBoard: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdmissionFormInput {
  tenantId: string;
  studentId: string;
  formData: Record<string, unknown>;
  companyId: string;
  showNotesDashBoard?: boolean;
  createdBy: string;
}

export class AdmissionForm extends AggregateRoot<AdmissionFormProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get studentId(): string {
    return this.props.studentId;
  }
  get formData(): Record<string, unknown> {
    return this.props.formData;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get showNotesDashBoard(): boolean {
    return this.props.showNotesDashBoard;
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
    formData?: Record<string, unknown>;
    showNotesDashBoard?: boolean;
  }): void {
    if (input.formData !== undefined) this.props.formData = input.formData;
    if (input.showNotesDashBoard !== undefined) this.props.showNotesDashBoard = input.showNotesDashBoard;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateAdmissionFormInput, id?: string): AdmissionForm {
    return new AdmissionForm(
      {
        tenantId: input.tenantId,
        studentId: input.studentId,
        formData: input.formData,
        companyId: input.companyId,
        showNotesDashBoard: input.showNotesDashBoard ?? false,
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
      studentId: string;
      formData: Record<string, unknown>;
      companyId: string;
      showNotesDashBoard: boolean;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): AdmissionForm {
    return new AdmissionForm(props, id);
  }
}
