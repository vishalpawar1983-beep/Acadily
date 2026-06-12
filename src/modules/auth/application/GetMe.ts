import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export interface GetMeRequest {
  tenantId: string;
  userId: string;
}

export interface GetMeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleType;
  isActive: boolean;
  createdAt: Date;
}

export class GetMe implements UseCase<GetMeRequest, GetMeResponse> {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(request: GetMeRequest): Promise<GetMeResponse> {
    const user = await this.userRepo.findById(request.tenantId, request.userId);
    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
