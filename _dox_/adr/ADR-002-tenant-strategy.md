# ADR-002: Shared Database with Tenant Discriminator

> Status: ACCEPTED | Date: 2026-03-07 | Deciders: Vishal Anu, AI Tech Lead

## Context

Multi-tenancy requires a data isolation strategy. Three options:

1. **Separate databases per tenant** — Each tenant gets their own MongoDB database
2. **Shared database, separate collections** — Same DB, but `tenant_students`, `tenant_courses`, etc.
3. **Shared database, shared collections, tenant discriminator** — Same DB, same collections, `tenantId` field on every document

## Decision

**Option 3: Shared database, shared schema, `tenantId` discriminator on every document.**

## Rationale

### Why NOT separate databases:
- Already have 4 separate DBs — this IS the current problem. Copy-paste scaling.
- Connection pooling overhead: each DB needs its own connection pool.
- Schema migrations must run N times (once per tenant DB).
- MongoDB Atlas free tier: 1 cluster with multiple DBs is fine, but connection limits are shared anyway.
- Aggregating data across tenants (super-admin dashboard) requires cross-DB queries.

### Why NOT separate collections:
- Collection explosion: 30 models x N tenants = hundreds of collections.
- Mongoose model registration becomes dynamic and complex.
- Same migration overhead as separate DBs.

### Why shared schema + tenantId:
- **Simple** — One connection, one set of models, one migration.
- **Efficient** — MongoDB handles compound indexes well. `{ tenantId: 1, email: 1 }` is fast.
- **Atlas-friendly** — Single database uses the 512MB free tier most efficiently.
- **Scalable** — Handles 100+ tenants without operational overhead.
- **Easy reporting** — Super-admin can query across tenants naturally.

### Risks and mitigations:
| Risk | Mitigation |
|------|-----------|
| Forgot tenantId in query = data leak | TenantScopedRepository base class + Mongoose pre-query plugin |
| Noisy neighbor (one tenant slows all) | Monitor per-tenant query patterns, add rate limiting per tenant |
| Data growth in single DB | MongoDB sharding if >10GB (unlikely in near term) |

## Consequences

- Every Mongoose schema MUST include `tenantId: { type: String, required: true, index: true }`
- Every query MUST go through TenantScopedRepository (direct Model.find() is banned)
- Mongoose plugin provides defense-in-depth: throws if query lacks tenantId
- Integration tests MUST verify cross-tenant isolation
- Compound indexes on `{ tenantId, ...otherFields }` for all frequently queried collections
