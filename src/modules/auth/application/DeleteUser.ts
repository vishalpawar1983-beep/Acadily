import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { NotFoundError, ForbiddenError } from '../../../shared/domain/errors.js';

export interface DeleteUserRequest {
  tenantId: string;
  userId: string;
  requestingUserId: string;
}

export interface DeleteUserResponse {
  message: string;
}

export class DeleteUser implements UseCase<DeleteUserRequest, DeleteUserResponse> {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    if (request.userId === request.requestingUserId) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    const user = await this.userRepo.findById(request.tenantId, request.userId);
    if (!user) {
      throw new NotFoundError('User', request.userId);
    }

    if (user.isSuperAdmin()) {
      throw new ForbiddenError('Cannot delete a SuperAdmin user');
    }

    await this.userRepo.delete(request.tenantId, request.userId);

    return { message: 'User deleted successfully' };
  }
}
