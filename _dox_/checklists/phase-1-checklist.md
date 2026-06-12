# Phase 1 Completion Gate Checklist

> Status: NOT STARTED | Target: Week 3-8

## Shared Kernel
- [ ] Base Entity class with ID generation
- [ ] Base ValueObject class (immutable, equality by value)
- [ ] AggregateRoot base class
- [ ] TenantContext type and middleware
- [ ] TenantScopedRepository base class
- [ ] Mongoose tenant plugin (defense-in-depth)
- [ ] AppError hierarchy (NotFound, Validation, Conflict, Forbidden)
- [ ] Global error handler middleware
- [ ] Request context propagation (correlationId, tenantId, userId)
- [ ] Unit tests for shared kernel

## Auth Module
- [ ] User domain entity
- [ ] Role value object
- [ ] IUserRepository interface
- [ ] MongoUserRepository implementation
- [ ] LoginUseCase (with password verification)
- [ ] RegisterUseCase (with duplicate check)
- [ ] RefreshTokenUseCase (token rotation)
- [ ] JwtTokenService (access + refresh tokens)
- [ ] AuthRouter + AuthController
- [ ] Zod schemas for login/register
- [ ] Unit tests for use cases
- [ ] Integration tests for auth flow
- [ ] Rate limiting applied

## Tenant Module
- [ ] Tenant domain entity
- [ ] TenantConfig value object
- [ ] ITenantRepository interface
- [ ] MongoTenantRepository implementation
- [ ] CreateTenantUseCase
- [ ] GetTenantConfigUseCase
- [ ] Tenant resolution middleware (subdomain + header + JWT)
- [ ] Tenant seeding script
- [ ] 4 tenants seeded (ims_reliance, chanakya, webliquid, salon_main)
- [ ] Tests for tenant resolution

## Student Module
- [ ] Student entity mapped from legacy `addmission_form`
- [ ] All value objects (PersonalInfo, AcademicInfo, etc.)
- [ ] IStudentRepository + MongoStudentRepository
- [ ] EnrollStudent, UpdateStudent, GetStudents, DropOutStudent use cases
- [ ] StudentRouter + StudentController
- [ ] Zod validation schemas
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests

## Course + Batch Module
- [ ] Course entity with subjects
- [ ] Batch entity with timing, trainer, lab
- [ ] BatchCategory entity
- [ ] All repositories
- [ ] CRUD use cases
- [ ] Routes and controllers
- [ ] Tests

## Fees/Billing Module
- [ ] StudentFees aggregate
- [ ] Installment tracking
- [ ] Receipt generation
- [ ] Easebuzz adapter (clean interface)
- [ ] DayBook entries on payment
- [ ] All repositories
- [ ] Use cases
- [ ] Routes and controllers
- [ ] Tests

## Remaining Modules
- [ ] Attendance module (entities, repos, use cases, routes, tests)
- [ ] Communication module (email service, templates, reminders)
- [ ] Custom Forms module
- [ ] Teacher module
- [ ] Approval module
- [ ] User Role Access module
- [ ] Salon module (separate bounded context)

## Data Migration
- [ ] Migration script written (`scripts/migrate-data.ts`)
- [ ] Dry run executed successfully
- [ ] Data migrated to Atlas staging
- [ ] Document counts verified (source vs target per tenant)
- [ ] 10 random documents spot-checked per collection per tenant
- [ ] Cross-tenant isolation verified
- [ ] Compound indexes created
- [ ] Rollback plan documented and tested

## Integration Verification
- [ ] All API endpoints functional
- [ ] Multi-tenant: same endpoint returns different data for different tenants
- [ ] Auth flow: login → access token → API call → refresh → new token
- [ ] RBAC: roles enforce access correctly
- [ ] Legacy API compatibility (if using Nginx rewrites)
- [ ] Frontend connects to new API (staging)

## Quality Gates
- [ ] Test coverage >70% overall
- [ ] Zero TypeScript errors (`tsc --noEmit` passes)
- [ ] Zero lint errors
- [ ] All Zod schemas cover all endpoints
- [ ] No direct `Model.find()` calls (all through repositories)
- [ ] No `console.log` in codebase
- [ ] No `any` types in domain/application layers

## Sign-off
- [ ] All items above checked
- [ ] Legacy apps still running (parallel operation)
- [ ] Documentation updated
- Approved by: _______________
- Date: _______________
