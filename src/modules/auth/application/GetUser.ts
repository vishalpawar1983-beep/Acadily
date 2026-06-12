import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export interface GetUserRequest {
  tenantId: string;
  userId: string;
}

export interface GetUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetUser implements UseCase<GetUserRequest, GetUserResponse> {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(request: GetUserRequest): Promise<GetUserResponse> {
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
      updatedAt: user.updatedAt,
    };
  }
}
