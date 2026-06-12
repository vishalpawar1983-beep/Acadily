import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IProfileRepository } from '../domain/repositories/IProfileRepository.js';

export interface GetProfileRequest {
  tenantId: string;
  userId: string;
}

export interface GetProfileResponse {
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

export class GetProfile implements UseCase<GetProfileRequest, GetProfileResponse | null> {
  constructor(private readonly repo: IProfileRepository) {}

  async execute(request: GetProfileRequest): Promise<GetProfileResponse | null> {
    const profile = await this.repo.findByUserId(request.tenantId, request.userId);
    if (!profile) {
      return null;
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
