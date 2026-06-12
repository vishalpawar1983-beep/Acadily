import { Tenant } from "../domain/entities/Tenant.js";
import { NotFoundError } from "../../../shared/domain/errors.js";
import type { ITenantRepository } from "../domain/repositories/ITenantRepository.js";
import { TenantModel, type ITenantDocument } from "./TenantModel.js";
import type { PlanType } from "../domain/entities/Tenant.js";

export class MongoTenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const doc = await TenantModel.findOne({ tenantId: id }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const doc = await TenantModel.findOne({ slug }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ tenants: Tenant[]; total: number }> {
    const [docs, total] = await Promise.all([
      TenantModel.find()
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      TenantModel.countDocuments().exec(),
    ]);

    return {
      tenants: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(tenant: Tenant): Promise<Tenant> {
    const doc = await TenantModel.create({
      _id: tenant.id,
      tenantId: tenant.tenantId,
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone,
      website: tenant.website,
      address: tenant.address,
      logo: tenant.logo,
      config: {
        receiptPrefix: tenant.config.receiptPrefix,
        gstNumber: tenant.config.gstNumber,
        isGstEnabled: tenant.config.isGstEnabled,
        features: tenant.config.features,
      },
      isActive: tenant.isActive,
      plan: tenant.plan,
    });
    return this.toDomain(doc);
  }

  async update(tenant: Tenant): Promise<Tenant> {
    const doc = await TenantModel.findByIdAndUpdate(
      tenant.id,
      {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        website: tenant.website,
        address: tenant.address,
        logo: tenant.logo,
        config: {
          receiptPrefix: tenant.config.receiptPrefix,
          gstNumber: tenant.config.gstNumber,
          isGstEnabled: tenant.config.isGstEnabled,
          features: tenant.config.features,
        },
        isActive: tenant.isActive,
        plan: tenant.plan,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError("Tenant", tenant.id);
    return this.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await TenantModel.findByIdAndDelete(id).exec();
  }

  private toDomain(doc: ITenantDocument): Tenant {
    return Tenant.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      name: doc.name,
      slug: doc.slug,
      email: doc.email,
      phone: doc.phone,
      website: doc.website,
      address: doc.address,
      logo: doc.logo,
      config: {
        receiptPrefix: doc.config?.receiptPrefix ?? "",
        gstNumber: doc.config?.gstNumber,
        isGstEnabled: doc.config?.isGstEnabled ?? false,
        features: (doc.config?.features as Record<string, boolean>) ?? {},
      },
      isActive: doc.isActive,
      plan: doc.plan as PlanType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
