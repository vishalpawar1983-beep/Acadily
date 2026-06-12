import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface BatchCategoryProps {
  tenantId: string;
  categoryName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBatchCategoryInput {
  tenantId: string;
  categoryName: string;
  createdBy: string;
}

export class BatchCategory extends AggregateRoot<BatchCategoryProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get categoryName(): string {
    return this.props.categoryName;
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

  updateDetails(input: { categoryName?: string }): void {
    if (input.categoryName !== undefined) this.props.categoryName = input.categoryName;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateBatchCategoryInput, id?: string): BatchCategory {
    return new BatchCategory(
      {
        tenantId: input.tenantId,
        categoryName: input.categoryName,
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
      categoryName: string;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): BatchCategory {
    return new BatchCategory(props, id);
  }
}
