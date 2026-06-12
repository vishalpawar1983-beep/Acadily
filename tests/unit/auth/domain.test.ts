import { describe, it, expect } from '@jest/globals';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { Role } from '../../../src/modules/auth/domain/value-objects/Role';
import { Email } from '../../../src/modules/auth/domain/value-objects/Email';

describe('Role value object', () => {
  it('should create a valid role', () => {
    const role = Role.create('Admin');
    expect(role.value).toBe('Admin');
  });

  it('should throw for invalid role', () => {
    expect(() => Role.create('InvalidRole')).toThrow('Invalid role');
  });

  it('should identify admin roles', () => {
    expect(Role.create('Admin').isAdmin()).toBe(true);
    expect(Role.create('SuperAdmin').isAdmin()).toBe(true);
    expect(Role.create('Student').isAdmin()).toBe(false);
  });

  it('should identify super admin', () => {
    expect(Role.create('SuperAdmin').isSuperAdmin()).toBe(true);
    expect(Role.create('Admin').isSuperAdmin()).toBe(false);
  });

  it('should compare by value', () => {
    const role1 = Role.create('Admin');
    const role2 = Role.create('Admin');
    expect(role1.equals(role2)).toBe(true);
  });
});

describe('Email value object', () => {
  it('should normalize email to lowercase', () => {
    const email = Email.create('User@Example.COM');
    expect(email.value).toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    const email = Email.create('  user@test.com  ');
    expect(email.value).toBe('user@test.com');
  });

  it('should throw for invalid email', () => {
    expect(() => Email.create('not-an-email')).toThrow('Invalid email');
    expect(() => Email.create('')).toThrow('Invalid email');
  });
});

describe('User entity', () => {
  const validInput = {
    tenantId: 'tenant_1',
    email: 'john@test.com',
    passwordHash: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('should create a user with default Student role', () => {
    const user = User.create(validInput);
    expect(user.email).toBe('john@test.com');
    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.fullName).toBe('John Doe');
    expect(user.role).toBe('Student');
    expect(user.isActive).toBe(true);
    expect(user.id).toBeDefined();
  });

  it('should create a user with specified role', () => {
    const user = User.create({ ...validInput, role: 'Admin' });
    expect(user.role).toBe('Admin');
    expect(user.isAdmin()).toBe(true);
  });

  it('should set and clear refresh token', () => {
    const user = User.create(validInput);
    expect(user.refreshToken).toBeUndefined();

    user.setRefreshToken('token_123');
    expect(user.refreshToken).toBe('token_123');

    user.setRefreshToken(undefined);
    expect(user.refreshToken).toBeUndefined();
  });

  it('should deactivate user and clear refresh token', () => {
    const user = User.create(validInput);
    user.setRefreshToken('token_123');
    user.deactivate();

    expect(user.isActive).toBe(false);
    expect(user.refreshToken).toBeUndefined();
  });

  it('should reconstitute from persisted data', () => {
    const user = User.reconstitute('abc123', {
      tenantId: 'tenant_1',
      email: 'jane@test.com',
      passwordHash: 'hash',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'Counsellor',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(user.id).toBe('abc123');
    expect(user.email).toBe('jane@test.com');
    expect(user.role).toBe('Counsellor');
  });

  it('should compare by id', () => {
    const user1 = User.create(validInput, 'same-id');
    const user2 = User.create({ ...validInput, email: 'other@test.com' }, 'same-id');
    expect(user1.equals(user2)).toBe(true);
  });
});
