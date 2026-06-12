import { ProfileDetails } from '../domain/entities/ProfileDetails.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { IProfileRepository } from '../domain/repositories/IProfileRepository.js';
import { ProfileModel, type IProfileDocument } from './ProfileModel.js';

export class MongoProfileRepository implements IProfileRepository {
  async findById(tenantId: string, id: string): Promise<ProfileDetails | null> {
    const doc = await ProfileModel.findOne({ _id: id, tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByUserId(tenantId: string, userId: string): Promise<ProfileDetails | null> {
    const doc = await ProfileModel.findOne({ tenantId, userId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(profile: ProfileDetails): Promise<ProfileDetails> {
    const doc = await ProfileModel.create({
      _id: profile.id,
      tenantId: profile.tenantId,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      company: profile.company,
      contactPhone: profile.contactPhone,
      companySite: profile.companySite,
      country: profile.country,
      language: profile.language,
      timeZone: profile.timeZone,
      currency: profile.currency,
      communications: profile.communications,
      allowMarketing: profile.allowMarketing,
    });
    return this.toDomain(doc);
  }

  async update(profile: ProfileDetails): Promise<ProfileDetails> {
    const doc = await ProfileModel.findOneAndUpdate(
      { _id: profile.id, tenantId: profile.tenantId },
      {
        firstName: profile.firstName,
        lastName: profile.lastName,
        company: profile.company,
        contactPhone: profile.contactPhone,
        companySite: profile.companySite,
        country: profile.country,
        language: profile.language,
        timeZone: profile.timeZone,
        currency: profile.currency,
        communications: profile.communications,
        allowMarketing: profile.allowMarketing,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Profile', profile.id);
    return this.toDomain(doc);
  }

  private toDomain(doc: IProfileDocument): ProfileDetails {
    return ProfileDetails.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      userId: doc.userId,
      firstName: doc.firstName,
      lastName: doc.lastName,
      company: doc.company,
      contactPhone: doc.contactPhone,
      companySite: doc.companySite,
      country: doc.country,
      language: doc.language,
      timeZone: doc.timeZone,
      currency: doc.currency,
      communications: doc.communications ?? { email: false, phone: false },
      allowMarketing: doc.allowMarketing,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
