import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface DefaultSelectProps {
  tenantId: string;
  selectName: string;
  options: string[];
  mandatory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDefaultSelectInput {
  tenantId: string;
  selectName: string;
  options: string[];
  mandatory?: boolean;
}

export class DefaultSelect extends AggregateRoot<DefaultSelectProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get selectName(): string {
    return this.props.selectName;
  }
  get options(): string[] {
    return this.props.options;
  }
  get mandatory(): boolean {
    return this.props.mandatory;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    selectName?: string;
    options?: string[];
    mandatory?: boolean;
  }): void {
    if (input.selectName !== undefined) this.props.selectName = input.selectName;
    if (input.options !== undefined) this.props.options = input.options;
    if (input.mandatory !== undefined) this.props.mandatory = input.mandatory;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateDefaultSelectInput, id?: string): DefaultSelect {
    return new DefaultSelect(
      {
        tenantId: input.tenantId,
        selectName: input.selectName,
        options: input.options,
        mandatory: input.mandatory ?? false,
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
      selectName: string;
      options: string[];
      mandatory: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): DefaultSelect {
    return new DefaultSelect(props, id);
  }
}
