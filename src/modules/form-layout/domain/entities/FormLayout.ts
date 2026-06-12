import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export interface LayoutItem {
  id: string;
  name: string;
  order: number;
}

interface FormLayoutProps {
  tenantId: string;
  formId: string;
  type: 'column' | 'row';
  items: LayoutItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFormLayoutInput {
  tenantId: string;
  formId: string;
  type: 'column' | 'row';
  items: LayoutItem[];
  createdBy: string;
}

export class FormLayout extends AggregateRoot<FormLayoutProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get formId(): string {
    return this.props.formId;
  }
  get type(): 'column' | 'row' {
    return this.props.type;
  }
  get items(): LayoutItem[] {
    return this.props.items;
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

  updateItems(items: LayoutItem[]): void {
    this.props.items = items;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateFormLayoutInput, id?: string): FormLayout {
    return new FormLayout(
      {
        tenantId: input.tenantId,
        formId: input.formId,
        type: input.type,
        items: input.items,
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
      formId: string;
      type: 'column' | 'row';
      items: LayoutItem[];
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): FormLayout {
    return new FormLayout(props, id);
  }
}
