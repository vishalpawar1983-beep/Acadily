import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from './ports/IPasswordHasher.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/domain/errors.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export interface UpdateUserRequest {
  tenantId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: RoleType;
  password?: string;
  requestingUserRole: RoleType;
}

export interface UpdateUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleType;
  isActive: boolean;
}

export class UpdateUser implements UseCase<UpdateUserRequest, UpdateUserResponse> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    if (request.requestingUserRole !== 'SuperAdmin') {
      throw new ForbiddenError('Only SuperAdmin can edit users');
    }

    const user = await this.userRepo.findById(request.tenantId, request.userId);
    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    // Check email uniqueness if email is being changed
    if (request.email && request.email !== user.email) {
      const existing = await this.userRepo.findByEmail(request.tenantId, request.email);
      if (existing) {
        throw new ConflictError('User with this email already exists');
      }
    }

    user.updateDetails({
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      phone: request.phone,
      role: request.role,
    });

    if (request.password) {
      const passwordHash = await this.passwordHasher.hash(request.password);
      user.updatePassword(passwordHash);
    }

    const updated = await this.userRepo.update(user);

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      role: updated.role,
      isActive: updated.isActive,
    };
  }
}
