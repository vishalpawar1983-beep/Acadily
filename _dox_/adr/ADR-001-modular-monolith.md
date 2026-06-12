# ADR-001: Modular Monolith over Microservices

> Status: ACCEPTED | Date: 2026-03-07 | Deciders: Vishal Anu, AI Tech Lead

## Context

The system needs to migrate from copy-paste deployed monoliths to a scalable architecture. Two options were considered:
1. Microservices from day one
2. Modular monolith with DDD boundaries, decomposable later

## Decision

**We will build a Modular Monolith with DDD bounded contexts.**

## Rationale

### Why NOT microservices now:
- **Zero operational maturity** — No tests, no CI/CD, no Docker, no monitoring. Microservices will multiply operational pain by 5-10x.
- **Small team** — Microservices need dedicated DevOps. We don't have that yet.
- **Low scale** — 4 tenants, <500MB data, <100 concurrent users. A single Node.js process handles this trivially.
- **Distributed complexity** — Network latency, eventual consistency, distributed tracing, service discovery — all unnecessary overhead at this scale.
- **Server constraints** — 3.8GB RAM. Running 5+ containers with their own Node.js runtimes would exhaust memory.

### Why modular monolith:
- **Same DDD boundaries** — Identical domain modeling. Modules can become services later with minimal refactoring.
- **Simpler deployment** — One container, one process, one deployment pipeline.
- **In-process communication** — Function calls instead of HTTP/gRPC. Zero network overhead.
- **Transaction safety** — MongoDB transactions within a single connection. No distributed transactions needed.
- **Fast iteration** — Refactor across modules without versioning APIs between services.

### Extraction triggers (when to go microservices):
- A single module consuming >60% of server resources
- Team grows beyond 5 developers needing independent deployments
- Compliance requires physical isolation (e.g., PCI-DSS for payments)
- Need to scale a module independently (e.g., notifications during bulk email)

## Consequences

- Must enforce module boundaries via code reviews and directory structure (no cross-module direct imports)
- Must use dependency injection so modules communicate through interfaces
- Must design domain events even for in-process communication (makes future extraction trivial)
- Slightly more discipline required than a typical monolith
