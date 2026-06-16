import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export type CustomFieldFormType = 'admission' | 'enquiry';

interface CustomFieldProps {
  tenantId: string;
  companyId?: string;
  formType: CustomFieldFormType;
  formId?: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'email' | 'textarea' | 'radio' | 'url' | 'currency';
  options: string[];
  mandatory: boolean;
  defaultValue?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomFieldInput {
  tenantId: string;
  companyId?: string;
  formType?: CustomFieldFormType;
  formId?: string;
  fieldName: string;
  fieldType: CustomFieldProps['fieldType'];
  options?: string[];
  mandatory?: boolean;
  defaultValue?: string;
  createdBy: string;
}

export class CustomField extends AggregateRoot<CustomFieldProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get companyId(): string | undefined {
    return this.props.companyId;
  }
  get formType(): CustomFieldFormType {
    return this.props.formType;
  }
  get formId(): string | undefined {
    return this.props.formId;
  }
  get fieldName(): string {
    return this.props.fieldName;
  }
  get fieldType(): string {
    return this.props.fieldType;
  }
  get options(): string[] {
    return this.props.options;
  }
  get mandatory(): boolean {
    return this.props.mandatory;
  }
  get defaultValue(): string | undefined {
    return this.props.defaultValue;
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
    fieldName?: string;
    fieldType?: CustomFieldProps['fieldType'];
    options?: string[];
    mandatory?: boolean;
    defaultValue?: string;
  }): void {
    if (input.fieldName !== undefined) this.props.fieldName = input.fieldName;
    if (input.fieldType !== undefined) this.props.fieldType = input.fieldType;
    if (input.options !== undefined) this.props.options = input.options;
    if (input.mandatory !== undefined) this.props.mandatory = input.mandatory;
    if (input.defaultValue !== undefined) this.props.defaultValue = input.defaultValue;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateCustomFieldInput, id?: string): CustomField {
    return new CustomField(
      {
        tenantId: input.tenantId,
        companyId: input.companyId,
        formType: input.formType ?? 'admission',
        formId: input.formId,
        fieldName: input.fieldName,
        fieldType: input.fieldType,
        options: input.options ?? [],
        mandatory: input.mandatory ?? false,
        defaultValue: input.defaultValue,
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
      companyId?: string;
      formType: CustomFieldFormType;
      formId?: string;
      fieldName: string;
      fieldType: CustomFieldProps['fieldType'];
      options: string[];
      mandatory: boolean;
      defaultValue?: string;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): CustomField {
    return new CustomField(props, id);
  }
}
