import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export interface FormFieldValue {
  fieldName: string;
  fieldType: string;
  value: unknown;
}

interface FormSubmissionProps {
  tenantId: string;
  formId: string;
  values: FormFieldValue[];
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFormSubmissionInput {
  tenantId: string;
  formId: string;
  values: FormFieldValue[];
  addedBy: string;
}

export class FormSubmission extends AggregateRoot<FormSubmissionProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get formId(): string {
    return this.props.formId;
  }
  get values(): FormFieldValue[] {
    return this.props.values;
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

  updateDetails(input: {
    values?: FormFieldValue[];
    addedBy?: string;
  }): void {
    if (input.values !== undefined) this.props.values = input.values;
    if (input.addedBy !== undefined) this.props.addedBy = input.addedBy;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateFormSubmissionInput, id?: string): FormSubmission {
    return new FormSubmission(
      {
        tenantId: input.tenantId,
        formId: input.formId,
        values: input.values,
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
      formId: string;
      values: FormFieldValue[];
      addedBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): FormSubmission {
    return new FormSubmission(props, id);
  }
}
