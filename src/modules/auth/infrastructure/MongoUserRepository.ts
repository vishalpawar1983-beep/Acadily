import { User } from '../domain/entities/User.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { UserModel, type IUserDocument } from './UserModel.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export class MongoUserRepository implements IUserRepository {
  async findById(tenantId: string, id: string): Promise<User | null> {
    const doc = await UserModel.findOne({ _id: id, tenantId })
      .select('+passwordHash +refreshToken')
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ tenantId, email: email.toLowerCase() })
      .select('+passwordHash +refreshToken +otp +otpExpiresAt')
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmailAnyTenant(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() })
      .select('+passwordHash +refreshToken +otp +otpExpiresAt')
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(user: User): Promise<User> {
    const doc = await UserModel.create({
      _id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      refreshToken: user.refreshToken,
      otp: user.otp,
      otpExpiresAt: user.otpExpiresAt,
      isOtpVerified: user.isOtpVerified,
    });
    return this.toDomain(doc);
  }

  async update(user: User): Promise<User> {
    const doc = await UserModel.findOneAndUpdate(
      { _id: user.id, tenantId: user.tenantId },
      {
        email: user.email,
        passwordHash: user.passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        refreshToken: user.refreshToken,
        otp: user.otp,
        otpExpiresAt: user.otpExpiresAt,
        isOtpVerified: user.isOtpVerified,
      },
      { new: true },
    )
      .select('+passwordHash +refreshToken')
      .exec();
    if (!doc) throw new NotFoundError('User', user.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await UserModel.deleteOne({ _id: id, tenantId }).exec();
  }

  async findAll(
    tenantId: string,
    options: { skip?: number; limit?: number; role?: string; excludeRole?: string; search?: string } = {},
  ): Promise<{ users: User[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId };
    if (options.role) filter.role = options.role;
    if (options.excludeRole) filter.role = { ...((filter.role as object) || {}), $ne: options.excludeRole };
    if (options.search) {
      const regex = { $regex: options.search, $options: 'i' };
      filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
    }

    const [docs, total] = await Promise.all([
      UserModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      UserModel.countDocuments(filter).exec(),
    ]);

    return {
      users: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  private toDomain(doc: IUserDocument): User {
    return User.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      email: doc.email,
      passwordHash: doc.passwordHash ?? '',
      firstName: doc.firstName,
      lastName: doc.lastName,
      phone: doc.phone,
      role: doc.role as RoleType,
      isActive: doc.isActive,
      refreshToken: doc.refreshToken,
      otp: doc.otp,
      otpExpiresAt: doc.otpExpiresAt,
      isOtpVerified: doc.isOtpVerified,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
