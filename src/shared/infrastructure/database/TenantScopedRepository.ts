import { Model, FilterQuery, UpdateQuery, QueryOptions, Document } from 'mongoose';

export abstract class TenantScopedRepository<TDoc extends Document> {
  constructor(protected readonly model: Model<TDoc>) {}

  protected scopeQuery(tenantId: string, filter: FilterQuery<TDoc> = {}): FilterQuery<TDoc> {
    return { ...filter, tenantId } as FilterQuery<TDoc>;
  }

  async findOne(tenantId: string, filter: FilterQuery<TDoc>): Promise<TDoc | null> {
    return this.model.findOne(this.scopeQuery(tenantId, filter)).exec();
  }

  async findById(tenantId: string, id: string): Promise<TDoc | null> {
    return this.model.findOne(this.scopeQuery(tenantId, { _id: id } as FilterQuery<TDoc>)).exec();
  }

  async find(
    tenantId: string,
    filter: FilterQuery<TDoc> = {},
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> } = {},
  ): Promise<TDoc[]> {
    let query = this.model.find(this.scopeQuery(tenantId, filter));
    if (options.sort) query = query.sort(options.sort);
    if (options.skip) query = query.skip(options.skip);
    if (options.limit) query = query.limit(options.limit);
    return query.exec();
  }

  async count(tenantId: string, filter: FilterQuery<TDoc> = {}): Promise<number> {
    return this.model.countDocuments(this.scopeQuery(tenantId, filter)).exec();
  }

  async create(tenantId: string, data: Partial<TDoc>): Promise<TDoc> {
    const doc = new this.model({ ...data, tenantId });
    return doc.save();
  }

  async updateById(
    tenantId: string,
    id: string,
    update: UpdateQuery<TDoc>,
    options?: QueryOptions,
  ): Promise<TDoc | null> {
    return this.model
      .findOneAndUpdate(this.scopeQuery(tenantId, { _id: id } as FilterQuery<TDoc>), update, {
        new: true,
        ...options,
      })
      .exec();
  }

  async deleteById(tenantId: string, id: string): Promise<boolean> {
    const result = await this.model
      .deleteOne(this.scopeQuery(tenantId, { _id: id } as FilterQuery<TDoc>))
      .exec();
    return result.deletedCount > 0;
  }
}
