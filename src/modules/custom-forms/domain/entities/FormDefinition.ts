import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'number' | 'email' | 'date' | 'datetime-local' | 'url' | 'currency' | 'textarea';
  options?: Array<{ label: string; value: string }>;
  mandatory: boolean;
  headerView: boolean;
}

interface FormDefinitionProps {
  tenantId: string;
  formName: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFormDefinitionInput {
  tenantId: string;
  formName: string;
  fields: FormField[];
  isActive?: boolean;
}

export class FormDefinition extends AggregateRoot<FormDefinitionProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get formName(): string {
    return this.props.formName;
  }
  get fields(): FormField[] {
    return this.props.fields;
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

  updateDetails(input: {
    formName?: string;
    fields?: FormField[];
    isActive?: boolean;
  }): void {
    if (input.formName !== undefined) this.props.formName = input.formName;
    if (input.fields !== undefined) this.props.fields = input.fields;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateFormDefinitionInput, id?: string): FormDefinition {
    return new FormDefinition(
      {
        tenantId: input.tenantId,
        formName: input.formName,
        fields: input.fields.map((f) => ({
          name: f.name,
          type: f.type,
          options: f.options,
          mandatory: f.mandatory ?? false,
          headerView: f.headerView ?? false,
        })),
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
      formName: string;
      fields: FormField[];
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): FormDefinition {
    return new FormDefinition(props, id);
  }
}
