# 00 - Project Charter

> Version: 1.1 | Last Updated: 2026-03-07 | Status: ACTIVE

## Current Status

| Phase | Status | Details |
|-------|--------|---------|
| Phase 0 | COMPLETE | Security middleware, structured logging, health checks, Render staging deployment |
| Phase 1 | NOT STARTED | Auth module (pattern-setter), Tenant management, DDD modules |
| Phase 2 | NOT STARTED | Observability dashboard, Grafana + Loki, EWS |
| Phase 3 | NOT STARTED | Production cutover, data migration |

**Staging URL**: https://ims-fullstack.onrender.com
**Repository**: https://bitbucket.org/aiinfox-wrk/ims-fullstack
**Database**: MongoDB Atlas M0 (flex_academy_dev / flex_academy_staging)

## Project Name
Flex Academy Portal - Enterprise Migration

## Vision
Transform a copy-paste deployed institute management system into a scalable, multi-tenant SaaS platform with enterprise-grade observability, security, and architecture.

## Problem Statement
The current system is a teaching project deployed to production:
- 3 identical copies of the same codebase deployed for different clients (IMS, Chanakya1, WebliquidStudio)
- 1 separate Saloon Management app sharing the same server
- Zero tests, zero CI/CD, zero observability
- Security vulnerabilities (open CORS, no input validation, secrets in plaintext, running as root)
- No multi-tenancy - scaling means copying the entire codebase again

## Scope

### In Scope
- Multi-tenant architecture (single codebase, tenant-aware)
- DDD backend refactor (bounded contexts, layered architecture)
- Structured logging with grep-enabled JSON output
- Health check dashboard with business metrics
- Early Warning System (EWS) with alerts
- MongoDB Atlas migration (staging on free tier)
- Docker containerization
- CI/CD pipeline
- Security hardening

### Out of Scope (Phase 1)
- Microservices decomposition (deferred to Phase 3, only if needed)
- Frontend rewrite (frontend works, will be adapted for multi-tenancy)
- Mobile app
- Payment gateway migration (Easebuzz stays)

## Stakeholders
- **Product Owner**: Vishal Anu
- **Technical Lead**: AI-assisted development
- **Current Users**: 3 institutes (IMS/Reliance, Chanakya, WebliquidStudio/Dabims), 1 salon

## Constraints
- Server: Single VPS (66.116.207.89), 4 vCPU AMD EPYC, 3.8GB RAM, 99GB disk
- Budget: Free-tier MongoDB Atlas for staging
- Existing users must not experience downtime during migration
- All production data must be preserved

## Success Criteria
- [ ] Single codebase serving all tenants
- [ ] New tenant onboarding in < 30 minutes (config only, no code copy)
- [ ] Structured JSON logs with correlation IDs
- [ ] Dashboard showing system + business health
- [ ] Alert notifications on anomalies
- [ ] Zero critical security vulnerabilities
- [ ] Automated deployment pipeline
- [ ] Test coverage > 70% on backend services
