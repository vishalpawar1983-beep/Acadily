# Flex Academy Portal

## Project
Multi-tenant Institute & Salon Management Platform. Modular monolith with DDD architecture.

## Architecture
- **Pattern**: Modular monolith with DDD bounded contexts (NOT microservices)
- **Language**: TypeScript (strict mode), ES Modules
- **Runtime**: Node.js 22 LTS
- **Framework**: Express 4 + Zod validation
- **Database**: MongoDB (Atlas M0 for dev/staging, local for production)
- **Logger**: Pino (structured JSON)
- **Process Manager**: Docker + PM2 inside container

## Key Directories
- `_dox_/` — Documentation (single source of truth, anti-drift)
- `_src_/` — Legacy source code (reference only, do NOT modify)
- `src/` — New application code
- `src/shared/` — Shared Kernel (auth, tenant, logging, base classes)
- `src/modules/` — Bounded contexts (auth, tenant, student, course, fees, salon, etc.)
- `docker/` — Dockerfile, compose, PM2 ecosystem
- `tests/` — Unit, integration, e2e tests

## DDD Rules
1. Domain layer has ZERO imports from infrastructure or interface
2. All DB queries go through TenantScopedRepository (never direct Model.find())
3. Every document has tenantId — every query is scoped
4. One use case per file
5. Entities via factory methods, value objects are immutable

## Conventions
- File naming: PascalCase for classes, camelCase for non-class
- Routes: `/api/v1/{module}/{resource}`
- Errors: AppError hierarchy (NotFound, Validation, Conflict, etc.)
- Logs: Pino structured JSON, never console.log
- Commits: `type(scope): description`

## Deployment
- **Staging**: Render (auto-deploy on push to main) — https://ims-fullstack.onrender.com
- **Production**: Docker + PM2 on VPS (Phase 3)
- **Repository**: Bitbucket (aiinfox-wrk/ims-fullstack)
- **Database**: Atlas M0 free tier (flex_academy_dev / flex_academy_staging)
- **Config**: `render.yaml` for Render, `docker/` for production

## Commands
- `npm run dev` — Dev server with hot reload
- `npm run build` — TypeScript compile
- `npm run typecheck` — Type check without emit
- `npm test` — Run tests
- `npm run lint` — ESLint

## Live Endpoints (Staging)
- `GET /` — Frontend landing page
- `GET /health` — Liveness probe
- `GET /ready` — Readiness probe (DB + memory)
- `GET /api/v1/ping` — Tenant-aware ping (requires X-Tenant-Id header)

## Anti-Patterns (BANNED)
- `console.log` — use logger
- `cors({ origin: "*" })` — use whitelist
- `any` type in domain/application layers
- Direct Model.find() without tenantId
- Business logic in controllers
