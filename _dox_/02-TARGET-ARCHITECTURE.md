# 02 - Target Architecture

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## Architecture Vision

**Modular Monolith with DDD** - NOT microservices (yet). A single deployable unit with clean internal boundaries that can be decomposed later if scale demands it.

```
                         Internet
                            |
                      [Nginx / Reverse Proxy]
                            |
               [Docker Container: flex-academy-api]
                            |
                    ┌───────┼───────────┐
                    │   Express Gateway  │
                    │  (Auth, Tenant,    │
                    │   CORS, Logger,    │
                    │   Rate Limiter)    │
                    └───────┼───────────┘
                            |
            ┌───────────────┼───────────────┐
            |               |               |
     [Institute Module] [Salon Module]  [Shared Kernel]
     ┌──────────────┐  ┌────────────┐  ┌─────────────┐
     │ Student      │  │ Service    │  │ Auth/IAM    │
     │ Course       │  │ Customer   │  │ Tenant      │
     │ Batch        │  │ Cart       │  │ Notification│
     │ Fees/Billing │  │ Payment    │  │ File Storage│
     │ Attendance   │  │ Category   │  │ Audit Log   │
     │ Communication│  │ Appointment│  │ Config      │
     │ Custom Forms │  └────────────┘  └─────────────┘
     │ Day Book     │
     │ Teachers     │
     │ Approvals    │
     └──────────────┘
            |               |               |
            └───────────────┼───────────────┘
                            |
                    ┌───────┼───────────┐
                    │   Data Access      │
                    │  (Repositories)    │
                    │  Tenant-scoped     │
                    └───────┼───────────┘
                            |
                   [MongoDB Atlas / Local]
                   (Single DB, tenantId on every doc)
```

## Layer Architecture (Per Module)

```
┌─────────────────────────────────────────┐
│  Interface Layer (Routes / Controllers) │  ← HTTP concerns only
├─────────────────────────────────────────┤
│  Application Layer (Use Cases/Services) │  ← Orchestration, no business rules
├─────────────────────────────────────────┤
│  Domain Layer (Entities, Value Objects) │  ← Pure business logic, no DB/HTTP
├─────────────────────────────────────────┤
│  Infrastructure Layer (Repos, External) │  ← MongoDB, Email, Cloudinary, etc.
└─────────────────────────────────────────┘
```

### Layer Rules (ENFORCED)

| Layer | Can Depend On | Cannot Depend On |
|-------|--------------|-----------------|
| Interface | Application, Domain | Infrastructure directly |
| Application | Domain | Infrastructure directly (uses interfaces) |
| Domain | Nothing (pure) | Application, Interface, Infrastructure |
| Infrastructure | Domain (implements interfaces) | Application, Interface |

## Directory Structure (Target)

```
flex-academy-portal/
├── _dox_/                          # Documentation (this directory)
├── _src_/                          # Legacy source (reference only)
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── docker-compose.staging.yml
│   └── .dockerignore
├── src/
│   ├── index.ts                    # Entry point
│   ├── server.ts                   # Express server setup
│   ├── config/
│   │   ├── index.ts                # Env config with validation (Zod)
│   │   ├── database.ts
│   │   └── logger.ts
│   ├── shared/                     # Shared Kernel
│   │   ├── domain/
│   │   │   ├── Entity.ts           # Base entity class
│   │   │   ├── ValueObject.ts      # Base value object
│   │   │   ├── AggregateRoot.ts
│   │   │   └── DomainEvent.ts
│   │   ├── application/
│   │   │   └── UseCase.ts          # Base use case interface
│   │   ├── infrastructure/
│   │   │   ├── middleware/
│   │   │   │   ├── tenantResolver.ts
│   │   │   │   ├── authGuard.ts
│   │   │   │   ├── rateLimiter.ts
│   │   │   │   ├── requestLogger.ts
│   │   │   │   ├── correlationId.ts
│   │   │   │   ├── inputValidator.ts
│   │   │   │   └── errorHandler.ts
│   │   │   ├── logger/
│   │   │   │   └── PinoLogger.ts
│   │   │   ├── database/
│   │   │   │   ├── MongoConnection.ts
│   │   │   │   └── TenantScopedRepository.ts
│   │   │   └── health/
│   │   │       └── HealthCheckService.ts
│   │   └── types/
│   │       ├── TenantContext.ts
│   │       └── RequestContext.ts
│   ├── modules/
│   │   ├── auth/                   # Auth & IAM Module
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── interface/
│   │   ├── tenant/                 # Tenant Management Module
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── interface/
│   │   ├── student/                # Student Module
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── Student.ts
│   │   │   │   ├── value-objects/
│   │   │   │   │   ├── StudentId.ts
│   │   │   │   │   └── RollNumber.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── IStudentRepository.ts
│   │   │   │   └── events/
│   │   │   │       └── StudentEnrolled.ts
│   │   │   ├── application/
│   │   │   │   ├── EnrollStudent.ts
│   │   │   │   ├── UpdateStudent.ts
│   │   │   │   └── GetStudents.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── MongoStudentRepository.ts
│   │   │   └── interface/
│   │   │       ├── StudentRouter.ts
│   │   │       └── StudentController.ts
│   │   ├── course/
│   │   ├── batch/
│   │   ├── fees/
│   │   ├── attendance/
│   │   ├── communication/         # Email, WhatsApp, Notifications
│   │   ├── custom-forms/
│   │   ├── day-book/
│   │   ├── teacher/
│   │   ├── approval/
│   │   └── salon/                  # Salon bounded context (FULLY INDEPENDENT)
│   │       ├── domain/             # Zero overlap with institute modules
│   │       ├── application/        # Own use cases, own workflows
│   │       ├── infrastructure/     # Own repos, Cloudinary adapter
│   │       └── interface/          # Own routes: /api/v1/salon/*
│   └── dashboard/
│       ├── HealthController.ts
│       ├── MetricsController.ts
│       └── DashboardService.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── migrate-data.ts             # Data migration from legacy DBs
│   ├── seed-tenant.ts              # Tenant seeding script
│   └── health-check.sh
├── .env.example
├── .env.staging
├── .gitignore
├── tsconfig.json
├── package.json
├── jest.config.ts
└── CLAUDE.md
```

## Technology Stack (Target)

| Concern | Current | Target | Rationale |
|---------|---------|--------|-----------|
| Language | JavaScript (ES modules) | TypeScript | Type safety, better DDD support |
| Runtime | Node.js 24 | Node.js 22 LTS | Stability for production |
| Framework | Express 4 | Express 4 + Zod | Proven, add validation |
| Database | MongoDB local | MongoDB Atlas M0 (dev+staging) + local (prod) | Free tier for dev & staging (~14MB data, 512MB limit) |
| ODM | Mongoose 8 | Mongoose 8 | Keep - it works, add tenant plugin |
| Auth | JWT (manual) | JWT + refresh tokens (proper) | Fix security gaps |
| Logging | console.log | Pino (JSON) | Structured, grep-able, fast |
| Validation | None | Zod | Schema validation on all inputs |
| Testing | None | Jest + Supertest | Unit + integration |
| Process Mgr | PM2 | Docker + PM2 inside container | Container isolation |
| File Storage | Local disk / Cloudinary | Cloudinary (unified) | No local file dependency |
| Email | Nodemailer direct | Nodemailer + queue (Bull) | Prevent blocking, retry failed |
| Cron | node-cron | node-cron (keep) | Works fine for this scale |
| Config | dotenv raw | dotenv + Zod validation | Fail fast on missing config |

## Key Design Decisions

1. **Modular Monolith over Microservices** - See ADR-001
2. **Shared DB with tenantId over DB-per-tenant** - See ADR-002
3. **Docker + PM2 inside container** - See ADR-003
4. **MongoDB Atlas free tier for staging** - See ADR-004
