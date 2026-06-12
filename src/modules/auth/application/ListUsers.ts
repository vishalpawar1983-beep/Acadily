import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export interface ListUsersRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface ListUsersResponse {
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: RoleType;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export class ListUsers implements UseCase<ListUsersRequest, ListUsersResponse> {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(request: ListUsersRequest): Promise<ListUsersResponse> {
    const page = request.page > 0 ? request.page : 1;
    const limit = request.limit > 0 ? request.limit : 20;
    const skip = (page - 1) * limit;

    const { users, total } = await this.userRepo.findAll(request.tenantId, {
      skip,
      limit,
      excludeRole: 'Student',
      search: request.search,
    });

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
