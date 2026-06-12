# Flex Academy Portal

![Phase 0](https://img.shields.io/badge/Phase_0-COMPLETE-brightgreen)
![Phase 1](https://img.shields.io/badge/Phase_1-COMPLETE-brightgreen)
![Phase 2](https://img.shields.io/badge/Phase_2-PARTIAL-yellow)
![Phase 3](https://img.shields.io/badge/Phase_3-IN_PROGRESS-blue)
![Node](https://img.shields.io/badge/Node.js-22_LTS-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![License](https://img.shields.io/badge/License-PRIVATE-red)

Multi-tenant Institute & Salon Management SaaS Platform built with Domain-Driven Design.

---

## Modernization Summary

### Before (Legacy)

Five separate apps copy-pasted on a single VPS (`66.116.207.89`):

```
├── IMS Reliance       → Express + Mongoose, DB: SchoolsStore,     port 3002
├── Chanakya           → Exact copy of IMS,   DB: Chanakya,        port 4003
├── VMA                → Copy of Dabims,      DB: via Dabims,      port 3001
├── WebliquidStudio    → Copy of Dabims,      DB: webliquidStudio, port 8001
└── Salon Management   → Independent app,     DB: Saloon,          port 5002
```

- Frontend: React/TypeScript (Metronic v8.2.0) for IMS/Dabims, React/Vite (JSX) for Salon
- Zero tests, zero CI/CD, zero observability
- Critical security vulnerabilities (open CORS, no input validation, shared JWT secret, root PM2)
- New client = copy entire codebase (days of work)
- 14,000 LOC backend, 74,500 LOC frontend, 30+ Mongoose models per copy

### After (Modernized)

Single multi-tenant codebase with DDD architecture:

- **37 bounded context modules**, 537 TypeScript files
- **33 legacy features ported** + 12 new platform enhancements
- **71+ unit tests** across domain and application layers
- Multi-tenancy via `tenantId` discriminator on every document
- Structured JSON logging (Pino), Prometheus metrics, Early Warning System
- New tenant onboarding in **under 30 minutes** (config only, no code copy)

---

## Architecture

```
                     Internet
                        |
                  [Nginx / Reverse Proxy]
                        |
           [Docker Container: flex-academy-api]
                        |
                ┌───────┼───────────┐
                │   Express Gateway  │
                │  Auth, Tenant,     │
                │  CORS, Rate Limit, │
                │  Logger, Metrics   │
                └───────┼───────────┘
                        |
        ┌───────────────┼───────────────┐
        |               |               |
  [Institute]     [Salon Module]   [Shared Kernel]
  Student, Course  Service, Cart    Auth/IAM, Tenant
  Batch, Fees      Customer         Notification
  Attendance       Payment          File Storage
  Marks, Issues    Category         Config, Logging
  DayBook, Forms   Appointment      Metrics, EWS
  Teachers, RBAC
        |               |               |
        └───────────────┼───────────────┘
                        |
                [MongoDB (Atlas / Local)]
                tenantId on every document
```

**Pattern:** Modular Monolith with DDD (NOT microservices)
**Multi-tenancy:** Shared database, shared schema, `tenantId` discriminator
**Layer architecture per module:** Interface → Application → Domain → Infrastructure

### Tech Stack

| Concern | Technology |
|---------|-----------|
| Language | TypeScript (strict mode), ES Modules |
| Runtime | Node.js 22 LTS |
| Framework | Express 4 + Zod validation |
| Database | MongoDB (Atlas M0 dev/staging, local for prod) |
| ODM | Mongoose 8 |
| Auth | JWT access + refresh tokens, bcrypt |
| Logging | Pino (structured JSON) |
| Metrics | Prometheus (prom-client) |
| Testing | Jest |
| Process Mgr | Docker + PM2 inside container |
| API Docs | Swagger/OpenAPI at `/api-docs` |
| Frontend (IMS) | React 18 + TypeScript (Metronic v8.2.0 template) |
| Frontend (Salon) | React + Vite (JavaScript) |

---

## Modules (37 Bounded Contexts)

| Module | Route | Description |
|--------|-------|-------------|
| auth | `/api/v1/auth` | JWT login, registration, refresh tokens, RBAC |
| tenant | `/api/v1/tenants` | Multi-tenant company management |
| student | `/api/v1/students` | Enrollment, updates, dropout, alerts |
| course | `/api/v1/courses` | Course + embedded subjects |
| batch | `/api/v1/batches` | Batch scheduling, student progress |
| fees | `/api/v1/fees` | Fee payment recording |
| installments | `/api/v1/installments` | Installment plans, overdue tracking |
| attendance | `/api/v1/attendance` | Daily attendance marking |
| teacher | `/api/v1/teachers` | Teacher CRUD |
| marks | `/api/v1/marks` | Exam results, theory + practical |
| completion | `/api/v1/completions` | Course graduation, certificates |
| daybook | `/api/v1/daybook` | Double-entry accounting |
| issues | `/api/v1/issues` | Student complaints, status workflow |
| notes | `/api/v1/notes` | Per-student notes with reminders |
| approval | `/api/v1/approvals` | Approval workflows |
| rbac | `/api/v1/rbac` | Role-based permissions |
| custom-forms | `/api/v1/custom-forms` | Dynamic form builder + submissions |
| email-templates | `/api/v1/email-templates` | HTML email templates |
| settings | `/api/v1/settings` | Tenant settings (6 legacy singletons consolidated) |
| receipt | `/api/v1/receipts` | Sequential receipt numbering |
| lab | `/api/v1/labs` | Lab management |
| timing | `/api/v1/timings` | Schedule time slots |
| profile | `/api/v1/profile` | User profile details |
| commission | `/api/v1/commissions` | Student referral commissions |
| roll-number | `/api/v1/roll-numbers` | Auto-increment roll numbers |
| payment-options | `/api/v1/payment-options` | Payment method config |
| + 11 more | — | admission-forms, batch-categories, categories, course-types, custom-fields, email-logs, form-layout, number-of-years, payment-gateway, subjects, trainers |

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- MongoDB (Atlas connection string or local instance)

### Setup

```bash
# Clone the repository
git clone https://bitbucket.org/aiinfox-wrk/ims-fullstack.git
cd ims-fullstack

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Fill in required values (see Environment Variables below)
```

### Local Development (No Docker)

Docker is only needed for production. For local development, you just need Node.js and a MongoDB connection (Atlas free tier works).

**Step 1 — Install dependencies**
```bash
npm install
```

**Step 2 — Create `.env` from the example**
```bash
cp .env.example .env
```

**Step 3 — Fill in the 3 required values in `.env`**
```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/flex_academy_dev
JWT_ACCESS_SECRET=<paste-64-char-hex>
JWT_REFRESH_SECRET=<paste-64-char-hex>
```

Generate JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Step 4 — Start the dev server**
```bash
npm run dev
```

The server starts at `http://localhost:3001` with hot reload. That's it.

**Step 5 — Verify it's running**
```
GET http://localhost:3001/health    → liveness check
GET http://localhost:3001/ready     → DB + memory check
GET http://localhost:3001/api-docs  → Swagger UI
```

### All Scripts

```bash
# ── Development ──
npm run dev              # Start dev server with hot reload (tsx watch)
                         # Stop: Ctrl+C

# ── Production Build ──
npm run build            # Compile TypeScript to dist/
npm run start            # Start production server (node dist/index.js)
                         # Stop: Ctrl+C

# ── Quality Checks ──
npm run typecheck        # Type check without emit
npm run lint             # ESLint
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# ── Docker (Production only) ──
docker compose up -d     # Start API + observability stack
docker compose down      # Stop all containers
docker compose logs -f   # Tail logs
docker compose restart   # Restart containers
```

---

## Data Migration

### What Changed

Consolidated **5 separate databases** into **1 unified multi-tenant database**:

```
BEFORE (VPS 66.116.207.89)              AFTER (Atlas / Local)
─────────────────────────                ─────────────────────
SchoolsStore  (IMS)       ──┐           flex_academy
Chanakya      (Chanakya)  ──┤             All collections with tenantId
VMA           (Dabims)    ──┼──────►      discriminator per document
webliquidStudio (Dabims)  ──┤
Saloon        (Salon)     ──┘
```

**Total data migrated:** ~7,521 documents, ~30 MB across 5 tenants

### Tenants

| Tenant ID | Source DB | Source App |
|-----------|-----------|------------|
| `ims_reliance` | SchoolsStore | IMS Reliance |
| `chanakya` | Chanakya | Chanakya's Prep |
| `vma` | via Dabims | VMA (Dabims codebase) |
| `webliquid` | webliquidStudio | WebliquidStudio / Dabims |
| `salon_main` | Saloon | Salon Management |

### Collection Mapping (Key Changes)

| Legacy Collection | New Collection | Fix |
|-------------------|---------------|-----|
| `addmissionforms` | `students` | Fixed typo, renamed entity |
| `attendences` | `attendance_records` | Fixed typo |
| `coursefees` | `course_fees` | Normalized naming |
| `reciptfees` | `receipt_fees` | Fixed typo |
| `paymentinstallmenttimeexpires` | `installments` | Simplified name |
| `emailremainders` | `email_reminders` | Fixed typo (remainder → reminder) |
| `studentcomissions` | `student_commissions` | Fixed typo |
| `daybookdatas` | `day_book_entries` | Meaningful name |
| 4× suggestion singletons | `settings` | Consolidated into tenant settings |

Full mapping: [`_dox_/09-DATABASE-MIGRATION-PLAN.md`](_dox_/09-DATABASE-MIGRATION-PLAN.md)

### Migration Flow

```
1. PREPARE   → Backup all source DBs (mongodump)
2. DRY RUN   → Run migration script with --dry-run, verify counts
3. MIGRATE   → Add tenantId to every document, apply transforms, insert into unified DB
4. INDEX     → Create compound indexes (tenantId + business keys)
5. VERIFY    → Count checks, spot-check documents, verify ObjectId references
6. CUTOVER   → Point app to unified DB, monitor 24h, keep legacy 30 days
```

### Rollback

Legacy apps are **never stopped** during migration. If anything fails:
1. Stop new application
2. Legacy apps continue serving (untouched)
3. Drop unified database
4. Fix script, retry

### Migration Scripts

```bash
scripts/
├── migrate-from-vps.ts          # Main migration: VPS dumps → Atlas
├── migrate-final-fixes.ts       # Post-migration data fixes
├── migrate-final-fixes2.ts      # Additional fixes
├── migrate-fix-dupes.ts         # Deduplicate records
├── migrate-fix-dupes2.ts        # Additional dedup
├── compare-dbs.ts               # Compare source vs target counts
├── compare-vps-staging.ts       # Compare VPS vs staging data
├── audit-staging.ts             # Audit staging data integrity
├── fix-webliquid-users.ts       # Fix WebliquidStudio user records
├── e2e-setup.ts                 # E2E test data setup
├── e2e-cleanup.ts               # E2E test data cleanup
└── e2e-test.sh                  # E2E test runner
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development` / `staging` / `production` |
| `PORT` | No | `3001` | Server port |
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Yes | — | Min 32 characters |
| `JWT_REFRESH_SECRET` | Yes | — | Min 32 characters |
| `CORS_ORIGINS` | No | `localhost:3000,5173` | Comma-separated allowed origins |
| `LOG_LEVEL` | No | `info` | Pino log level |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Frontend landing page |
| GET | `/health` | No | Liveness probe (uptime, version) |
| GET | `/ready` | No | Readiness probe (DB + memory) |
| GET | `/metrics` | No | Prometheus scrape target |
| GET | `/ews/alerts` | No | Active EWS alerts |
| GET | `/api-docs` | No | Swagger API documentation |
| GET | `/api/v1/ping` | Yes* | Tenant-aware ping (*requires X-Tenant-Id) |
| — | `/api/v1/*` | Yes | All module routes (see Modules table) |

---

## Deployment

### Staging (Render)

Auto-deploys on push to `main`. Live at: https://ims-fullstack.onrender.com

```
[Git Push to main] → [Render auto-build] → [npm install + tsc] → [Deploy] → [Health check]
```

### Production (Docker + PM2 on VPS)

```
[Git Push] → [Lint + Typecheck] → [Tests] → [Docker Build] → [Deploy to VPS] → [Health check]
```

```bash
# On VPS
docker compose -f docker-compose.yml up -d
docker compose logs -f api          # Watch logs
curl http://localhost:3001/health    # Verify
curl http://localhost:3001/ready     # Check DB + memory
```

---

## Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| Phase 0 | **COMPLETE** | Security middleware, structured logging, health checks, Render deploy |
| Phase 1 | **COMPLETE** | Auth, Tenant, Student, Course, Fees, Attendance + 19 more modules. 71 tests. Data migration done |
| Phase 2 | **PARTIAL** | Prometheus metrics + EWS done. Grafana + Loki deferred to VPS Docker setup |
| Phase 3 | **IN PROGRESS** | Production cutover, Docker + PM2 on VPS, DNS setup, Nginx config |
| Phase 4 | **FUTURE** | Microservices decomposition (only if scale demands it) |

---

## Project Structure

```
flex-academy-portal/
├── _dox_/                    # Documentation (single source of truth)
│   ├── 00-PROJECT-CHARTER.md
│   ├── 01-CURRENT-STATE-AUDIT.md
│   ├── 02-TARGET-ARCHITECTURE.md
│   ├── 03-MIGRATION-ROADMAP.md
│   ├── 04-BOUNDED-CONTEXTS.md
│   ├── 04-FEATURE-TRACKER.md
│   ├── 05-MULTI-TENANCY-SPEC.md
│   ├── 06-INFRASTRUCTURE-SPEC.md
│   ├── 07-LOGGING-AND-OBSERVABILITY.md
│   ├── 08-EARLY-WARNING-SYSTEM.md
│   ├── 09-DATABASE-MIGRATION-PLAN.md
│   ├── 10-SECURITY-HARDENING.md
│   ├── 11-API-CONTRACTS.md
│   ├── 12-CODING-STANDARDS.md
│   ├── adr/                  # Architecture Decision Records
│   └── checklists/           # Phase completion gates
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # Express server setup
│   ├── config/               # Zod-validated env config
│   ├── shared/               # Shared Kernel (auth, tenant, logging, metrics, EWS)
│   └── modules/              # 37 bounded context modules (DDD)
│       ├── auth/             # Pattern-setter module
│       ├── tenant/
│       ├── student/
│       ├── course/
│       └── ... (33 more)
├── tests/                    # Unit, integration, e2e tests
├── _src_/                    # Legacy source code (reference only)
│   ├── ims/                  # IMS legacy backend + frontend source
│   ├── ims-frontend-source/  # IMS frontend source (recovered from VPS, with auth changes applied)
│   ├── chanakya1/            # Chanakya legacy (same IMS codebase)
│   ├── webliquid-studio/     # Dabims legacy (VMA + WebliquidStudio codebase)
│   ├── saloon/               # Salon legacy (React/Vite)
│   └── _infra_/              # Legacy nginx configs
├── scripts/                  # Migration, seeding, e2e scripts
├── docker/                   # Dockerfile, compose, PM2 ecosystem
└── frontend-build/           # Static frontend build (IMS, build-only — source in _src_/ims-frontend-source/)
```

---

## Documentation

Full architectural documentation lives in [`_dox_/`](_dox_/):

| Doc | Purpose |
|-----|---------|
| [Project Charter](_dox_/00-PROJECT-CHARTER.md) | Vision, scope, constraints |
| [Current State Audit](_dox_/01-CURRENT-STATE-AUDIT.md) | Legacy system analysis |
| [Target Architecture](_dox_/02-TARGET-ARCHITECTURE.md) | DDD architecture design |
| [Migration Roadmap](_dox_/03-MIGRATION-ROADMAP.md) | Phased execution plan |
| [Bounded Contexts](_dox_/04-BOUNDED-CONTEXTS.md) | Domain model |
| [Feature Tracker](_dox_/04-FEATURE-TRACKER.md) | 80 tracked features |
| [Multi-Tenancy Spec](_dox_/05-MULTI-TENANCY-SPEC.md) | Tenant isolation strategy |
| [Infrastructure Spec](_dox_/06-INFRASTRUCTURE-SPEC.md) | Docker, deployment, server |
| [Database Migration Plan](_dox_/09-DATABASE-MIGRATION-PLAN.md) | 4 DBs → 1 DB migration |
| [Security Hardening](_dox_/10-SECURITY-HARDENING.md) | Security fixes applied |
| [API Contracts](_dox_/11-API-CONTRACTS.md) | API conventions |
| [Coding Standards](_dox_/12-CODING-STANDARDS.md) | Code patterns |
| [VPS Server Audit](_dox_/13-VPS-SERVER-AUDIT.md) | VPS apps, frontend source status, local vs VPS comparison |

---

## License

**PRIVATE** — All rights reserved. This software is proprietary and confidential.
