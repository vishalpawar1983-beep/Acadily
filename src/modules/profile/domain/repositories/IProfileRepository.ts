import type { ProfileDetails } from '../entities/ProfileDetails.js';

export interface IProfileRepository {
  findById(tenantId: string, id: string): Promise<ProfileDetails | null>;
  findByUserId(tenantId: string, userId: string): Promise<ProfileDetails | null>;
  save(profile: ProfileDetails): Promise<ProfileDetails>;
  update(profile: ProfileDetails): Promise<ProfileDetails>;
}
