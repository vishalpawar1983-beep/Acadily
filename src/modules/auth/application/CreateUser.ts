import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from './ports/IPasswordHasher.js';
import { User } from '../domain/entities/User.js';
import { ConflictError, ForbiddenError } from '../../../shared/domain/errors.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export interface CreateUserRequest {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleType;
  requestingUserRole: RoleType;
}

export interface CreateUserResponse {
  message: string;
}

export class CreateUser implements UseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    if (request.requestingUserRole !== 'SuperAdmin' && request.requestingUserRole !== 'Admin') {
      throw new ForbiddenError('Only Admin or SuperAdmin can create users');
    }

    const existing = await this.userRepo.findByEmail(request.tenantId, request.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(request.password);

    const user = User.create({
      tenantId: request.tenantId,
      email: request.email,
      passwordHash,
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
      role: request.role,
    });

    await this.userRepo.save(user);

    return { message: 'User created successfully!' };
  }
}
