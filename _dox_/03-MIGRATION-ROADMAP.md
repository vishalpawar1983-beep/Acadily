# 03 - Migration Roadmap

> Version: 1.1 | Last Updated: 2026-03-07 | Status: ACTIVE

## Guiding Principles

1. **Zero downtime** - Legacy apps keep running until new system is proven
2. **Parallel run** - New system runs alongside old, data synced
3. **Incremental** - One module at a time, not big-bang rewrite
4. **Gate-based** - Each phase has exit criteria. No proceeding without passing the gate
5. **Staging first** - Everything proven on MongoDB Atlas free tier before touching production

---

## Phase 0: Foundation (Week 1-2)
**Theme: Security + Logging + Infrastructure**

### 0.1 Security Hardening -- DONE
- [x] Fix CORS - whitelist specific origins
- [x] Add Helmet.js for HTTP security headers (with CSP)
- [x] Add rate limiting (global 500/15min, auth 20/15min, OTP 3/min)
- [x] Remove `console.log` of MongoDB URI (Pino with field redaction)
- [x] `express-mongo-sanitize` installed
- [ ] Rotate ALL secrets per tenant (deferred to Phase 1)
- [ ] Create non-root user for PM2 on legacy (legacy fix - in progress)

### 0.2 Structured Logging -- DONE
- [x] Pino installed and configured (JSON output, pretty in dev)
- [x] Correlation ID middleware (UUID per request)
- [x] Request logging middleware (method, path, status, duration)
- [x] Sensitive fields redacted (passwords, tokens, URIs)
- [x] Log format and grep patterns documented

### 0.3 Infrastructure Setup -- DONE
- [x] New TypeScript project initialized (strict mode, ES2022)
- [x] Dockerfile + docker-compose.yml created
- [x] MongoDB Atlas free cluster connected (dev + staging DBs)
- [x] Bitbucket repository (aiinfox-wrk/ims-fullstack)
- [x] Render deployment (auto-deploy on push to main)
- [x] render.yaml service definition
- [x] CLAUDE.md project instructions

### 0.4 Health Checks -- DONE
- [x] `/health` endpoint (liveness - uptime, version, timestamp)
- [x] `/ready` endpoint (readiness - MongoDB ping, RSS memory, heap)
- [x] Docker HEALTHCHECK + Render health check configured
- [x] Frontend landing page with live health status

**Gate 0**: PASSED -- Logger producing JSON logs, Atlas connected, staging deployed to Render, health checks passing
**Deployed**: https://ims-fullstack.onrender.com
**Checklist**: `checklists/phase-0-checklist.md`

---

## Phase 1: DDD Refactor + Multi-Tenancy (Week 3-8)
**Theme: Architecture + Data Model**

### 1.1 Shared Kernel -- DONE
- [x] Base Entity, ValueObject, AggregateRoot classes
- [x] Tenant context middleware
- [x] Tenant-scoped base repository
- [x] Error handling strategy (AppError hierarchy in shared/domain)
- [x] Request context (correlation ID, tenant, user)

### 1.2 Auth Module (First Module - Pattern Setter) -- DONE
- [x] Domain: User entity, Email VO, Role VO
- [x] Application: RegisterUser, LoginUser, RefreshToken, GetMe, LogoutUser
- [x] Infrastructure: MongoUserRepository, JwtTokenService, PasswordService
- [x] Interface: AuthRouter, AuthController, Zod schemas
- [x] Tests: 25 unit tests (domain + use cases)
- [x] Security: hashed refresh tokens, role escalation prevention, explicit field mapping

### 1.3 Tenant Module -- DONE
- [x] Domain: Tenant entity, TenantConfig value object
- [x] Application: CreateTenant, GetTenant, ListTenants, UpdateTenant
- [x] Tenant resolution middleware (by X-Tenant-Id header)
- [x] Tenant seeding script (scripts/seed-tenants.ts)
- [x] Tests: 10 unit tests (domain)

### 1.4 Student Module -- DONE
- [x] Map legacy `addmission_form.models.js` to Student entity
- [x] Application: EnrollStudent, GetStudent, ListStudents, UpdateStudent, DropOutStudent
- [x] Tests: 7 unit tests (domain)

### 1.5 Course + Batch Module -- DONE
- [x] Course entity with embedded SubjectProps
- [x] Application: CreateCourse, GetCourse, ListCourses, UpdateCourse
- [x] Tests: 6 unit tests (domain)

### 1.6 Fees/Billing Module -- DONE
- [x] FeePayment entity (maps legacy CourseFees)
- [x] Application: RecordPayment, GetStudentFees, ListFees
- [x] Tests: 4 unit tests (domain)
- [ ] Receipt generation (Phase 3)
- [ ] Easebuzz integration (Phase 3)

### 1.7 Remaining Modules -- PARTIAL
- [x] Attendance (8 domain tests, markAttendance with validation)
- [ ] Communication (email, WhatsApp) — Phase 3
- [ ] Custom Forms — Phase 3
- [ ] Teachers — Phase 3
- [ ] Approvals — Phase 3
- [ ] User Role Access — Phase 3

### 1.8 Data Migration
- [ ] Write migration script: 3 DBs -> 1 DB with tenantId
- [ ] Test on Atlas staging
- [ ] Verify data integrity
- [ ] Document rollback plan

### 1.9 Salon Module (Separate Bounded Context)
- [ ] Map salon models to DDD
- [ ] Keep as separate module within monolith
- [ ] Shares Auth + Tenant from shared kernel

**Gate 1**: Core modules ported (Auth, Tenant, Student, Course, Fees, Attendance). 71 tests passing. Data migration pending.
**Checklist**: `checklists/phase-1-checklist.md`

---

## Phase 2: Observability + Dashboard (Week 9-12)
**Theme: Visibility + Alerting**

### 2.1 Metrics Collection -- DONE
- [x] Prometheus client metrics (prom-client v15)
- [x] Request duration histograms (flex_http_request_duration_seconds)
- [x] Request count + in-flight gauges
- [x] DB connection state gauge
- [x] Auth attempt counters (login/register, success/failure)
- [x] Business metrics gauges (active students, fee collection)
- [x] `/metrics` endpoint (Prometheus-compatible scrape target)

### 2.2 Dashboard
- [ ] Grafana setup (Docker container)
- [ ] System dashboard (CPU, memory, disk, network)
- [ ] Application dashboard (requests, errors, latency)
- [ ] Business dashboard (tenants, students, revenue)
- [ ] MongoDB dashboard (connections, ops, slow queries)

### 2.3 Early Warning System (EWS) -- DONE
- [x] Alert rules engine (EarlyWarningSystem class)
- [x] Notification channels (Slack/generic webhook)
- [x] Alert categories:
  - [x] Infrastructure: memory > 200MB warn / > 400MB critical, event loop lag
  - [x] Infrastructure: MongoDB connection state monitoring
- [x] Alert severity levels (warn -> critical -> emergency)
- [x] `/ews/alerts` endpoint (active alerts JSON)
- [x] EWS metrics counter (flex_ews_alerts_total)
- [ ] On-call notification routing (Phase 3)
- [ ] Business/security alert rules (Phase 3)

### 2.4 Log Aggregation
- [ ] Loki setup for log ingestion (lightweight alternative to ELK)
- [ ] Grafana log explorer
- [ ] Saved queries for common investigations
- [ ] Log-based alerts

**Gate 2**: Metrics collection live, EWS active with 3 rules, Prometheus endpoint available. Grafana + Loki deferred to Phase 3 (requires VPS Docker setup).
**Checklist**: `checklists/phase-2-checklist.md`

---

## Phase 3: Production Cutover + Optimization (Week 13-16)
**Theme: Go Live + Polish**

### 3.1 Production Migration
- [ ] Set up production MongoDB (Atlas paid tier or keep local with proper backup)
- [ ] Final data migration from legacy DBs
- [ ] DNS/subdomain setup per tenant
- [ ] Nginx reconfiguration for new architecture
- [ ] Blue-green deployment setup

### 3.2 Performance
- [ ] Database indexing strategy
- [ ] Query optimization (N+1 detection)
- [ ] Response caching where appropriate
- [ ] Image CDN via Cloudinary (migrate local images)

### 3.3 Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Onboarding guide for new tenants
- [ ] Runbook for operations
- [ ] Architecture diagram updates

---

## Phase 4: Microservices (FUTURE - Only If Needed)
**Theme: Scale on demand**

Trigger conditions for decomposition:
- Single module consuming >60% of resources
- Need independent scaling of specific modules
- Team grows to >5 developers needing independent deployments
- Compliance requires isolation (e.g., payments PCI-DSS)

Candidates for extraction:
1. Auth/IAM Service (first - cleanest boundary)
2. Billing/Payments Service (compliance driver)
3. Notification Service (async, queue-based)

---

## Timeline Summary

```
Week  1-2   [Phase 0] Security + Logging + Infra         ████
Week  3-4   [Phase 1] Shared Kernel + Auth + Tenant       ████
Week  5-6   [Phase 1] Student + Course + Fees modules     ████
Week  7-8   [Phase 1] Remaining modules + Data Migration  ████
Week  9-10  [Phase 2] Metrics + Dashboard                 ████
Week 11-12  [Phase 2] EWS + Log Aggregation               ████
Week 13-16  [Phase 3] Production Cutover                  ████████
Week 17+    [Phase 4] Microservices (only if needed)      ........
```
