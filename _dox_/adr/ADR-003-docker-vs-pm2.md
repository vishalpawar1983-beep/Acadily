# ADR-003: Docker + PM2 Hybrid Deployment

> Status: ACCEPTED | Date: 2026-03-07 | Deciders: Vishal Anu, AI Tech Lead

## Context

The server currently uses PM2 for process management. Docker is not installed but the server supports it (KVM, cgroups v2, overlay FS). Need to decide the deployment strategy.

Options:
1. **PM2 only** (current approach, just better organized)
2. **Docker only** (Docker restart policies, no PM2)
3. **Docker + PM2** (Docker for containerization, PM2 inside for process management)
4. **nohup/systemd** (bare minimum)

## Decision

**Option 3: Docker + PM2 inside the container.**

## Rationale

### nohup is eliminated immediately:
- No process monitoring, no auto-restart, no log management
- Only useful for quick debugging sessions
- Never appropriate for production
- Same as running `node index.js &` — one crash and the app is down until someone notices

### PM2 alone is insufficient because:
- No environment isolation (works on my machine problem)
- No reproducible builds (depends on system-level packages)
- No resource limits (a memory leak can take down the entire server)
- Harder to maintain dev/staging/prod parity

### Docker alone is insufficient because:
- Docker restart policies are basic (restart: always). No graceful reload, no cluster mode.
- No built-in zero-downtime reload
- No process-level metrics (PM2 provides CPU/memory per worker)

### Docker + PM2 gives the best of both:
- **Docker**: Isolation, reproducible builds, resource limits, health checks, compose for multi-service
- **PM2 (inside container)**: Cluster mode (2 workers), graceful reload, process monitoring, zero-downtime restarts
- `pm2-runtime` is designed specifically for running inside Docker containers

### Server can handle it:
- Docker engine: ~100MB RAM overhead
- Container with 2 PM2 workers: ~800MB allocated
- Total new overhead vs current PM2: ~100MB (Docker engine only)
- 3.8GB RAM is tight but feasible (see resource budget in 06-INFRASTRUCTURE-SPEC.md)

## Consequences

- Must install Docker on the server
- Dockerfile uses multi-stage build for small image size
- PM2 ecosystem config runs inside the container
- Docker health check points to `/health` endpoint
- docker-compose manages the full stack (API + Grafana + Loki)
- During migration, legacy PM2 apps coexist with Docker containers
- After migration, legacy PM2 apps are stopped, freeing ~500MB RAM

## Alternative: EC2 comparison

For context, this VPS is equivalent to an AWS EC2 `t3.medium` (2 vCPU, 4GB RAM). The same Docker + PM2 strategy works identically on EC2. The architecture is cloud-portable — if the VPS provider becomes a constraint, migrating to EC2/GCP/Azure is just a DNS change + Docker pull.
