# 06 - Infrastructure Specification

> Version: 1.1 | Last Updated: 2026-03-07 | Status: ACTIVE

## Server Assessment: Docker vs PM2 vs nohup

### Current Server Capabilities
| Capability | Status | Notes |
|-----------|--------|-------|
| KVM Virtualization | YES | `systemd-detect-virt` returns `kvm` |
| cgroups v2 | YES | Full cgroup controllers available |
| Overlay FS | YES | `/proc/filesystems` confirms |
| RAM | 3.8 GB | Tight but workable with Docker |
| Disk | 75 GB free | Plenty for images and volumes |
| Kernel | 5.15.0 | Fully supports Docker |

### Comparison: Docker vs PM2 vs nohup

| Criteria | Docker | PM2 | nohup |
|----------|--------|-----|-------|
| Process isolation | Full container | Process-level only | None |
| Resource limits | CPU/Memory cgroups | Limited | None |
| Reproducible env | Dockerfile = exact env | Depends on system | Depends on system |
| Health checks | Built-in | Built-in | Manual |
| Log management | Docker logs + drivers | PM2 logs | Manual redirect |
| Restart policy | always/on-failure | Built-in | Manual or systemd |
| Rolling deploy | docker-compose up -d | pm2 reload | Kill + restart |
| Dev/Prod parity | Identical | Close | No guarantee |
| Multi-service | docker-compose | pm2 ecosystem | Multiple terminals |
| Overhead | ~50-100MB base | ~30MB | ~0MB |
| Learning curve | Medium | Low | Very low |
| Staging/Prod match | Exact same image | Script-dependent | No |

### DECISION: Docker + PM2 inside container (See ADR-003)

**Why not just PM2?** No environment isolation, no reproducible builds, "works on my machine" risk.

**Why not just nohup?** Zero management capabilities. Only viable for quick debugging, never for production.

**Why Docker + PM2?** Docker gives container isolation and reproducible builds. PM2 inside the container gives process management, graceful reload, and cluster mode.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                    VPS Server                     │
│                 66.116.207.89                     │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │              Nginx (host)                    │ │
│  │  - SSL termination (future)                  │ │
│  │  - Reverse proxy to containers               │ │
│  │  - Static file serving (frontend builds)     │ │
│  └────────────┬───────────────┬────────────────┘ │
│               │               │                   │
│  ┌────────────▼────────┐ ┌───▼──────────────┐   │
│  │ flex-academy-api    │ │ flex-grafana      │   │
│  │ (Docker container)  │ │ (Docker container)│   │
│  │                     │ │                    │   │
│  │  Node.js + PM2      │ │  Grafana           │   │
│  │  Express app        │ │  Prometheus        │   │
│  │  Port: 3001         │ │  Loki              │   │
│  │                     │ │  Port: 3100        │   │
│  └────────────┬────────┘ └───────────────────┘   │
│               │                                   │
│  ┌────────────▼────────────────────────────────┐ │
│  │         MongoDB (host or Atlas)              │ │
│  │         Port: 27017                          │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │     Legacy Apps (PM2 - during migration)     │ │
│  │     IMS :3000/:3001                          │ │
│  │     Chanakya :4002/:4003                     │ │
│  │     Saloon :5000/:5002                       │ │
│  │     Webliquid :8000/:8001                    │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## Docker Configuration

### Dockerfile
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:22-alpine
RUN npm install -g pm2
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY ecosystem.config.cjs ./

# Non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["pm2-runtime", "ecosystem.config.cjs"]
```

### docker-compose.yml (Development)
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    env_file:
      - .env.dev
    environment:
      - NODE_ENV=development
      - MONGO_URI=${MONGO_ATLAS_URI}  # Atlas M0 free tier (flex_academy_dev)
    volumes:
      - ./src:/app/src  # Hot reload in dev
    restart: unless-stopped

  # No local MongoDB — using Atlas M0 free tier for dev + staging
  # Atlas provides: cloud access, no local install, same behavior as staging
  # Current data: ~14 MB total (512 MB limit = 97% headroom)

  # Observability stack
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3100:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    restart: unless-stopped

  loki:
    image: grafana/loki:latest
    ports:
      - "3200:3100"
    restart: unless-stopped

volumes:
  grafana_data:
```

### docker-compose.staging.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=staging
      - MONGO_URI=${MONGO_ATLAS_URI}  # Atlas free tier
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
```

### PM2 Ecosystem (inside container)
```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'flex-academy-api',
    script: './dist/index.js',
    instances: 2,           // 2 workers (half the CPUs)
    exec_mode: 'cluster',
    max_memory_restart: '400M',
    env: {
      NODE_ENV: 'production'
    },
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Logging (stdout/stderr -> Docker captures)
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }]
};
```

## Docker Installation on Server

```bash
# Install Docker on Ubuntu 22.04
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify
docker --version
docker compose version
```

## Deployment Pipeline (CI/CD)

### Staging (Render - Current)

```
[Git Push to main] → [Render auto-build] → [npm install + tsc] → [Deploy] → [Health check]
```

- **Platform**: Render (free hobby tier)
- **Live URL**: https://ims-fullstack.onrender.com
- **Source**: Bitbucket (aiinfox-wrk/ims-fullstack)
- **Build**: `npm install && npm run build`
- **Start**: `node dist/index.js`
- **Health Check**: `/health`
- **Auto-deploy**: On every push to `main`
- **Config**: `render.yaml` in repo root

### Production (Docker + PM2 - Phase 3)

```
[Git Push] → [CI Pipeline] → [Build + Test] → [Docker Build] → [Deploy to VPS]

Stages:
1. Lint + Type Check (tsc --noEmit)
2. Unit Tests (Jest)
3. Integration Tests (Jest + MongoDB Memory Server)
4. Docker Build
5. Push to Registry
6. SSH deploy: docker compose pull && docker compose up -d
7. Health check verification
8. Rollback if health check fails
```

## Nginx Configuration (Target)

```nginx
# Tenant-aware reverse proxy
server {
    listen 80;
    server_name *.flexacademy.in flexacademy.in;

    # Frontend static files
    root /var/www/flex-academy/frontend/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # API proxy to Docker container
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Pass subdomain as tenant hint
        proxy_set_header X-Tenant-Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Grafana dashboard
    location /grafana/ {
        proxy_pass http://127.0.0.1:3100/;
        proxy_set_header Host $host;
    }

    # Health check (no auth required)
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
    }
}
```

## MongoDB: Atlas Free Tier (Development + Staging)

### Actual Data Sizes (Measured 2026-03-07)

| Database | Data Size | Total Size | Objects |
|----------|----------|-----------|---------|
| SchoolsStore (IMS) | 5.7 MB | 4.4 MB | 3,323 |
| Chanakya | 24.2 MB | 7.0 MB | 4,069 |
| webliquidStudio | 53 KB | 1.8 MB | 66 |
| Saloon | 17 KB | 312 KB | 63 |
| **TOTAL** | **~30 MB** | **~13.5 MB** | **7,521** |

**Atlas M0 free tier (512 MB) has 97% headroom.** Sufficient for both development AND staging.

### Setup Steps
1. Create Atlas account at cloud.mongodb.com
2. Create free tier cluster (M0, 512MB)
3. Choose region closest to server (likely US or India)
4. Create database user with readWrite role
5. Whitelist IPs: `0.0.0.0/0` (required for Render/cloud services with dynamic IPs)
6. Get connection string
7. Use for BOTH development and staging environments

### Environment Strategy

| Environment | Database | Connection |
|-------------|----------|-----------|
| **Development** | Atlas M0 (free) | `mongodb+srv://...atlas.mongodb.net/flex_academy_dev` |
| **Staging** | Atlas M0 (free) | `mongodb+srv://...atlas.mongodb.net/flex_academy_staging` |
| **Production** | Local MongoDB on VPS | `mongodb://user:pass@127.0.0.1:27017/flex_academy` |

> Both dev and staging databases live on the same Atlas M0 cluster as separate databases.
> Combined they will use <60 MB — well within the 512 MB limit.

### Limitations (Free Tier M0)
- 512 MB storage (using ~14 MB = 2.7%)
- Shared RAM
- 100 max connections (using ~4-8)
- No automated backups (manual export only)
- No dedicated performance
- **More than sufficient for dev + staging with all 4 tenants**

### When You Would Outgrow M0
- ~50,000+ students with full history across all tenants
- Storing large binary data in MongoDB (don't — use Cloudinary)
- At that point: Atlas M10 ($57/mo) or keep local with proper backups

### Production Strategy
- Option A: Atlas M10 ($57/mo) — managed backups, monitoring, scaling
- Option B: Keep local MongoDB with proper backup cron + replica set
- Decision deferred to Phase 3

## Resource Budget (3.8GB RAM server)

| Component | RAM Allocation |
|-----------|---------------|
| OS + System | 400 MB |
| Nginx | 50 MB |
| Docker Engine | 100 MB |
| flex-academy-api (2 workers) | 800 MB |
| MongoDB (if local) | 500 MB |
| Grafana + Loki | 400 MB |
| Legacy apps (during migration) | 500 MB |
| Buffer | 1050 MB |
| **Total** | **3800 MB** |

During migration (legacy + new running): tight but feasible. After migration completes and legacy is shut down, ~1GB freed up.
