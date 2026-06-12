import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IProfileRepository } from '../domain/repositories/IProfileRepository.js';
import { ProfileDetails } from '../domain/entities/ProfileDetails.js';

export interface CreateOrUpdateProfileRequest {
  tenantId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  contactPhone?: string;
  companySite?: string;
  country?: string;
  language?: string;
  timeZone?: string;
  currency?: string;
  communications?: { email: boolean; phone: boolean };
  allowMarketing?: boolean;
}

export interface CreateOrUpdateProfileResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  company: string;
  contactPhone: string;
  companySite: string;
  country: string;
  language: string;
  timeZone: string;
  currency: string;
  communications: { email: boolean; phone: boolean };
  allowMarketing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateOrUpdateProfile
  implements UseCase<CreateOrUpdateProfileRequest, CreateOrUpdateProfileResponse>
{
  constructor(private readonly repo: IProfileRepository) {}

  async execute(request: CreateOrUpdateProfileRequest): Promise<CreateOrUpdateProfileResponse> {
    let profile = await this.repo.findByUserId(request.tenantId, request.userId);

    if (profile) {
      profile.updateDetails({
        firstName: request.firstName,
        lastName: request.lastName,
        company: request.company,
        contactPhone: request.contactPhone,
        companySite: request.companySite,
        country: request.country,
        language: request.language,
        timeZone: request.timeZone,
        currency: request.currency,
        communications: request.communications,
        allowMarketing: request.allowMarketing,
      });
      profile = await this.repo.update(profile);
    } else {
      const newProfile = ProfileDetails.create({
        tenantId: request.tenantId,
        userId: request.userId,
        firstName: request.firstName,
        lastName: request.lastName,
        company: request.company,
        contactPhone: request.contactPhone,
        companySite: request.companySite,
        country: request.country,
        language: request.language,
        timeZone: request.timeZone,
        currency: request.currency,
        communications: request.communications,
        allowMarketing: request.allowMarketing,
      });
      profile = await this.repo.save(newProfile);
    }

    return {
      id: profile.id,
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
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
