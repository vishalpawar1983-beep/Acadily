import { RoleAccess } from '../domain/entities/RoleAccess.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IRoleAccessRepository, FindAllRoleAccessOptions } from '../domain/repositories/IRoleAccessRepository.js';
import { RoleAccessModel, type IRoleAccessDocument } from './RoleAccessModel.js';

export class MongoRoleAccessRepository implements IRoleAccessRepository {
  async findById(tenantId: string, id: string): Promise<RoleAccess | null> {
    const doc = await RoleAccessModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByRole(tenantId: string, role: string): Promise<RoleAccess | null> {
    const doc = await RoleAccessModel.findOne({ tenantId, role }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    tenantId: string,
    options: FindAllRoleAccessOptions = {},
  ): Promise<{ roleAccesses: RoleAccess[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.isActive !== undefined) filter.isActive = options.isActive;

    const [docs, total] = await Promise.all([
      RoleAccessModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      RoleAccessModel.countDocuments(filter).exec(),
    ]);

    return {
      roleAccesses: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(roleAccess: RoleAccess): Promise<RoleAccess> {
    const doc = await RoleAccessModel.create({
      _id: roleAccess.id,
      tenantId: roleAccess.tenantId,
      role: roleAccess.role,
      permissions: roleAccess.permissions,
      isActive: roleAccess.isActive,
    });
    return this.toDomain(doc);
  }

  async update(roleAccess: RoleAccess): Promise<RoleAccess> {
    const doc = await RoleAccessModel.findOneAndUpdate(
      { _id: roleAccess.id, tenantId: roleAccess.tenantId },
      {
        role: roleAccess.role,
        permissions: roleAccess.permissions,
        isActive: roleAccess.isActive,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('RoleAccess', roleAccess.id);
    return this.toDomain(doc);
  }

  private toDomain(doc: IRoleAccessDocument): RoleAccess {
    const permissions: Record<string, boolean> = {};
    if (doc.permissions) {
      if (doc.permissions instanceof Map) {
        doc.permissions.forEach((value: boolean, key: string) => {
          permissions[key] = value;
        });
      } else {
        Object.assign(permissions, doc.permissions);
      }
    }

    return RoleAccess.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      role: doc.role,
      permissions,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
