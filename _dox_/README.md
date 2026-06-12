# Flex Academy Portal - Migration Documentation

## Anti-Drift Documentation System

This `_dox_` directory is the **single source of truth** for the Flex Academy Portal migration. Every architectural decision, implementation plan, and convention is documented here and must be referenced before writing code.

### Anti-Drift Rules

1. **No code without a doc** - Every feature/service must have a corresponding spec in `_dox_` before implementation begins
2. **Doc-first changes** - If the plan changes, update the doc FIRST, then update the code
3. **Version headers** - Every doc has a version and last-updated date. Stale docs (>2 weeks without review) get flagged
4. **Decision records** - All architectural decisions go in `adr/`. Once accepted, they are immutable (superseded, never edited)
5. **Drift check** - Before any PR merge, verify implementation matches the spec in `_dox_`

### Directory Structure

```
_dox_/
  README.md                          # This file - documentation index
  00-PROJECT-CHARTER.md              # Vision, scope, constraints, stakeholders
  01-CURRENT-STATE-AUDIT.md          # As-is system analysis
  02-TARGET-ARCHITECTURE.md          # To-be architecture (DDD, multi-tenant)
  03-MIGRATION-ROADMAP.md            # Phased execution plan with gates
  04-BOUNDED-CONTEXTS.md             # DDD bounded contexts & domain model
  05-MULTI-TENANCY-SPEC.md           # Multi-tenant strategy & data isolation
  06-INFRASTRUCTURE-SPEC.md          # Docker, deployment, server topology
  07-LOGGING-AND-OBSERVABILITY.md    # Logger, health checks, metrics
  08-EARLY-WARNING-SYSTEM.md         # Alerting, EWS, notification channels
  09-DATABASE-MIGRATION-PLAN.md      # MongoDB schema migration strategy
  10-SECURITY-HARDENING.md           # Security fixes, secrets, CORS, auth
  11-API-CONTRACTS.md                # API versioning, conventions, standards
  12-CODING-STANDARDS.md             # Code style, patterns, anti-patterns
  adr/                               # Architecture Decision Records
    ADR-001-modular-monolith.md
    ADR-002-tenant-strategy.md
    ADR-003-docker-vs-pm2.md
    ADR-004-mongodb-atlas-staging.md
  checklists/                        # Phase completion gates
    phase-0-checklist.md
    phase-1-checklist.md
    phase-2-checklist.md
```

### Phase Status

| Phase | Status | Key Deliverables |
|-------|--------|-----------------|
| Phase 0 | COMPLETE | Security middleware, Pino logger, health checks, Render staging |
| Phase 1 | NEXT | Auth module, Tenant CRUD, DDD bounded contexts, data migration |
| Phase 2 | Planned | Grafana dashboards, Loki log aggregation, EWS alerts |
| Phase 3 | Planned | Production cutover, Docker + PM2 on VPS |

### How to Use

- **Starting work?** Read `03-MIGRATION-ROADMAP.md` for current phase
- **Building a feature?** Check `04-BOUNDED-CONTEXTS.md` for domain boundaries
- **Writing an API?** Follow `11-API-CONTRACTS.md` conventions
- **Deploying?** Follow `06-INFRASTRUCTURE-SPEC.md`
- **Making an architectural choice?** Write an ADR in `adr/` first

### Quick Links

- **Staging**: https://ims-fullstack.onrender.com
- **Repository**: https://bitbucket.org/aiinfox-wrk/ims-fullstack
- **Health Check**: https://ims-fullstack.onrender.com/health
