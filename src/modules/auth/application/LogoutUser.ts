import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { UnauthorizedError } from '../../../shared/domain/errors.js';

export interface LogoutUserRequest {
  tenantId: string;
  userId: string;
}

export class LogoutUser implements UseCase<LogoutUserRequest, void> {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(request: LogoutUserRequest): Promise<void> {
    const user = await this.userRepo.findById(request.tenantId, request.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    user.setRefreshToken(undefined);
    await this.userRepo.update(user);
  }
}
