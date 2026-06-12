import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface CategoryProps {
  tenantId: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  tenantId: string;
  name: string;
  createdBy: string;
}

export class Category extends AggregateRoot<CategoryProps> {
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

  static create(input: CreateCategoryInput, id?: string): Category {
    return new Category(
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
  ): Category {
    return new Category(props, id);
  }
}
