# ADR-004: MongoDB Atlas Free Tier for Development & Staging

> Status: ACCEPTED | Date: 2026-03-07 | Updated: 2026-03-07 | Deciders: Vishal Anu, AI Tech Lead

## Context

Need a database for development and staging that mirrors production behavior without incurring costs. Production currently uses local MongoDB on the VPS.

## Decision

**Use MongoDB Atlas M0 (free tier) for BOTH development and staging. Keep local MongoDB for production (for now).**

Two separate databases on the same M0 cluster:
- `flex_academy_dev` — development
- `flex_academy_staging` — staging

## Rationale

### Atlas Free Tier (M0) provides:
- 512 MB storage — **current total data is only ~14 MB across all 4 legacy DBs (2.7% usage)**
- Even with both dev + staging databases, total usage stays well under 60 MB
- Shared cluster (sufficient for dev and staging)
- MongoDB 7.x compatibility
- Cloud-based — accessible from anywhere for development (no VPN/SSH needed)
- Built-in monitoring (basic)
- Connection string based — easy to switch environments via env var
- Multiple databases allowed on single M0 cluster

### Measured data sizes (2026-03-07):
| Database | Total Size |
|----------|-----------|
| SchoolsStore (IMS) | 4.4 MB |
| Chanakya | 7.0 MB |
| webliquidStudio | 1.8 MB |
| Saloon | 312 KB |
| **Combined** | **~13.5 MB** |

### Why Atlas for development too (not local MongoDB):
- Single source of truth — no "works on my machine" DB discrepancies
- No need to install MongoDB locally on dev machines
- Accessible from any dev machine without configuration
- Same driver behavior as staging (Atlas connection string, retry writes, etc.)
- Data sizes are trivially small — network latency is negligible for dev

### Why not Atlas for production (yet):
- Free tier is shared, performance not guaranteed
- Paid tier (M10) starts at $57/month — decision deferred to Phase 3
- Local MongoDB on the VPS has zero latency and is free
- The VPS has 75GB free disk — plenty for MongoDB data

### Production database strategy (Phase 3 decision):
- **Option A**: Atlas M10 ($57/mo) — managed backups, monitoring, scaling
- **Option B**: Local MongoDB with proper backup (mongodump cron to S3/cloud storage) + replica set
- Decision will be informed by staging experience with Atlas

## Consequences

- Development env: `MONGO_URI=mongodb+srv://...atlas.mongodb.net/flex_academy_dev`
- Staging env: `MONGO_URI=mongodb+srv://...atlas.mongodb.net/flex_academy_staging`
- Production env: `MONGO_URI=mongodb://user:pass@127.0.0.1:27017/flex_academy`
- Application code is identical — only the connection string changes
- Must whitelist all developer IPs and VPS IP in Atlas Network Access (or use 0.0.0.0/0 for dev convenience with strong DB passwords)
- Free tier connection limit (100) is sufficient for dev + staging combined
- Data migration testing happens on Atlas dev first, then staging, then replicated to local for production cutover
- No local MongoDB installation required for developers
