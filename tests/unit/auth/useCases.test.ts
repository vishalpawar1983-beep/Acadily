import { describe, it, expect, beforeEach } from '@jest/globals';
import { createHash } from 'node:crypto';
import { RegisterUser } from '../../../src/modules/auth/application/RegisterUser';
import { LoginUser } from '../../../src/modules/auth/application/LoginUser';
import { RefreshToken } from '../../../src/modules/auth/application/RefreshToken';
import { GetMe } from '../../../src/modules/auth/application/GetMe';
import { User } from '../../../src/modules/auth/domain/entities/User';
import type { IUserRepository } from '../../../src/modules/auth/domain/repositories/IUserRepository';

// Helper: same hash function as JwtTokenService.hashToken
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// In-memory repository for testing
class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async findById(tenantId: string, id: string): Promise<User | null> {
    return this.users.find((u) => u.tenantId === tenantId && u.id === id) ?? null;
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    return (
      this.users.find((u) => u.tenantId === tenantId && u.email === email.toLowerCase()) ?? null
    );
  }

  async save(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async update(user: User): Promise<User> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index >= 0) this.users[index] = user;
    return user;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    this.users = this.users.filter((u) => !(u.tenantId === tenantId && u.id === id));
  }

  async findAll(
    tenantId: string,
    options?: { skip?: number; limit?: number; role?: string; excludeRole?: string; search?: string },
  ): Promise<{ users: User[]; total: number }> {
    let filtered = this.users.filter((u) => u.tenantId === tenantId);
    if (options?.role) filtered = filtered.filter((u) => u.role === options.role);
    if (options?.excludeRole) filtered = filtered.filter((u) => u.role !== options.excludeRole);
    return { users: filtered, total: filtered.length };
  }
}

// Fake password service
const fakePasswordService = {
  async hash(password: string): Promise<string> {
    return `hashed_${password}`;
  },
  async compare(password: string, hash: string): Promise<boolean> {
    return hash === `hashed_${password}`;
  },
};

// Fake token service (generates unique tokens each call)
let tokenCounter = 0;
const fakeTokenService = {
  generateTokenPair(payload: { userId: string; tenantId: string; role: string }) {
    tokenCounter++;
    return {
      accessToken: `access_${payload.userId}_${tokenCounter}`,
      refreshToken: `refresh_${payload.userId}_${tokenCounter}`,
    };
  },
  verifyAccessToken(token: string) {
    const userId = token.replace(/^access_/, '').replace(/_\d+$/, '');
    return { userId, tenantId: 'tenant_1', role: 'Student' };
  },
  verifyRefreshToken(token: string) {
    if (token.startsWith('refresh_')) {
      const userId = token.replace(/^refresh_/, '').replace(/_\d+$/, '');
      return { userId, tenantId: 'tenant_1', role: 'Student' };
    }
    throw new Error('Invalid token');
  },
};

const TENANT_ID = 'tenant_1';

describe('RegisterUser', () => {
  let repo: InMemoryUserRepository;
  let useCase: RegisterUser;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new RegisterUser(repo, fakePasswordService, fakeTokenService as any);
  });

  it('should register a new user and return tokens', async () => {
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      email: 'john@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(result.user.email).toBe('john@test.com');
    expect(result.user.role).toBe('Student');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('should store hashed refresh token, not raw', async () => {
    const result = await useCase.execute({
      tenantId: TENANT_ID,
      email: 'john@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });

    const user = await repo.findByEmail(TENANT_ID, 'john@test.com');
    expect(user!.refreshToken).not.toBe(result.tokens.refreshToken);
    expect(user!.refreshToken).toBe(hashToken(result.tokens.refreshToken));
  });

  it('should throw ConflictError for duplicate email', async () => {
    await useCase.execute({
      tenantId: TENANT_ID,
      email: 'john@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });

    await expect(
      useCase.execute({
        tenantId: TENANT_ID,
        email: 'john@test.com',
        password: 'password456',
        firstName: 'Jane',
        lastName: 'Doe',
      }),
    ).rejects.toThrow('User with this email already exists');
  });

  it('should allow same email in different tenants', async () => {
    await useCase.execute({
      tenantId: 'tenant_1',
      email: 'john@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });

    const result = await useCase.execute({
      tenantId: 'tenant_2',
      email: 'john@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(result.user.email).toBe('john@test.com');
  });
});

describe('LoginUser', () => {
  let repo: InMemoryUserRepository;
  let loginUseCase: LoginUser;

  beforeEach(async () => {
    repo = new InMemoryUserRepository();
    loginUseCase = new LoginUser(repo, fakePasswordService, fakeTokenService as any);

    const registerUseCase = new RegisterUser(repo, fakePasswordService, fakeTokenService as any);
    await registerUseCase.execute({
      tenantId: TENANT_ID,
      email: 'john@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('should login with valid credentials', async () => {
    const result = await loginUseCase.execute({
      tenantId: TENANT_ID,
      email: 'john@test.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('john@test.com');
    expect(result.tokens.accessToken).toBeDefined();
  });

  it('should throw UnauthorizedError for wrong password', async () => {
    await expect(
      loginUseCase.execute({
        tenantId: TENANT_ID,
        email: 'john@test.com',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('should throw UnauthorizedError for non-existent email', async () => {
    await expect(
      loginUseCase.execute({
        tenantId: TENANT_ID,
        email: 'nobody@test.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('should throw UnauthorizedError for deactivated user', async () => {
    const user = await repo.findByEmail(TENANT_ID, 'john@test.com');
    user!.deactivate();
    await repo.update(user!);

    await expect(
      loginUseCase.execute({
        tenantId: TENANT_ID,
        email: 'john@test.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Account is deactivated');
  });
});

describe('RefreshToken', () => {
  let repo: InMemoryUserRepository;
  let refreshUseCase: RefreshToken;
  let registeredRefreshToken: string;

  beforeEach(async () => {
    repo = new InMemoryUserRepository();
    refreshUseCase = new RefreshToken(repo, fakeTokenService as any);

    const registerUseCase = new RegisterUser(repo, fakePasswordService, fakeTokenService as any);
    const result = await registerUseCase.execute({
      tenantId: TENANT_ID,
      email: 'john@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });
    registeredRefreshToken = result.tokens.refreshToken;
  });

  it('should refresh tokens with a valid refresh token', async () => {
    const result = await refreshUseCase.execute({
      refreshToken: registeredRefreshToken,
    });

    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('should throw for invalid refresh token', async () => {
    await expect(
      refreshUseCase.execute({ refreshToken: 'invalid_token' }),
    ).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should detect token reuse and invalidate all tokens', async () => {
    // First refresh succeeds
    await refreshUseCase.execute({ refreshToken: registeredRefreshToken });

    // Same token again = reuse detected (stored hash now differs)
    await expect(
      refreshUseCase.execute({ refreshToken: registeredRefreshToken }),
    ).rejects.toThrow('Token reuse detected');

    // Verify user's refresh token was cleared
    const user = await repo.findByEmail(TENANT_ID, 'john@test.com');
    expect(user!.refreshToken).toBeUndefined();
  });
});

describe('GetMe', () => {
  let repo: InMemoryUserRepository;
  let getMeUseCase: GetMe;
  let userId: string;

  beforeEach(async () => {
    repo = new InMemoryUserRepository();
    getMeUseCase = new GetMe(repo);

    const registerUseCase = new RegisterUser(repo, fakePasswordService, fakeTokenService as any);
    const result = await registerUseCase.execute({
      tenantId: TENANT_ID,
      email: 'john@test.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    });
    userId = result.user.id;
  });

  it('should return user profile', async () => {
    const result = await getMeUseCase.execute({
      tenantId: TENANT_ID,
      userId,
    });

    expect(result.email).toBe('john@test.com');
    expect(result.firstName).toBe('John');
    expect(result.role).toBe('Student');
  });

  it('should throw NotFoundError for non-existent user', async () => {
    await expect(
      getMeUseCase.execute({ tenantId: TENANT_ID, userId: 'non_existent' }),
    ).rejects.toThrow('not found');
  });
});
