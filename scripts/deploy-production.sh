#!/usr/bin/env bash
# Production deployment script — Flex Academy Portal
# Implements the runbook from AGENT_HANDOFF.md §2
# Usage: bash scripts/deploy-production.sh
# Requires: docker, sshpass (brew install hudochenkov/sshpass/sshpass on mac; apt install sshpass on linux)
set -euo pipefail

VPS_HOST="root@66.116.207.89"
VPS_PASS="zQ>iaRo"
VPS_DIR="/opt/flex-academy"
IMAGE="flex-academy-api:amd64"
ARCHIVE="/tmp/flex-academy-api-amd64.tar.gz"
HEALTH_URL="https://app.acadily.com/health"

SSH_OPTS="-o StrictHostKeyChecking=no -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa"
SSHPASS_CMD="SSHPASS='${VPS_PASS}' sshpass -e"

log() { echo "[$(date '+%H:%M:%S')] $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }

# ── Step 0: pre-flight ────────────────────────────────────────────────────────
log "Pre-flight checks..."
command -v docker   >/dev/null || die "docker not found"
command -v sshpass  >/dev/null || die "sshpass not found (brew install hudochenkov/sshpass/sshpass)"
docker info >/dev/null 2>&1   || die "Docker daemon not running — start Docker Desktop first (Pitfall #21)"

# ── Step 1: type-check + build ────────────────────────────────────────────────
log "Type-checking..."
npm run typecheck

log "Building TypeScript..."
npm run build

# ── Step 2: Docker image ──────────────────────────────────────────────────────
log "Building amd64 Docker image (takes 4-6 min)..."
docker buildx build --platform linux/amd64 -f docker/Dockerfile -t "${IMAGE}" --load .

# Verify the image was actually built (Pitfall #21)
docker image inspect "${IMAGE}" >/dev/null 2>&1 || die "Image not found after build — check Docker daemon logs"

# ── Step 3: Save + transfer ───────────────────────────────────────────────────
log "Saving and compressing image (~115-120 MB)..."
docker save "${IMAGE}" | gzip > "${ARCHIVE}"

log "Transferring to VPS..."
SSHPASS="${VPS_PASS}" sshpass -e scp ${SSH_OPTS} \
  "${ARCHIVE}" "${VPS_HOST}:${VPS_DIR}/"

# ── Step 4: Recreate container on VPS ────────────────────────────────────────
log "Recreating container on VPS (rm + run, NOT restart — env vars need re-binding)..."
SSHPASS="${VPS_PASS}" sshpass -e ssh ${SSH_OPTS} "${VPS_HOST}" bash << 'REMOTE'
set -euo pipefail
VPS_DIR="/opt/flex-academy"

echo "[VPS] Loading image..."
docker load < "${VPS_DIR}/flex-academy-api-amd64.tar.gz"

echo "[VPS] Stopping old container..."
docker rm -f flex-academy-api 2>/dev/null || true

echo "[VPS] Starting new container..."
docker run -d \
  --name flex-academy-api \
  --restart unless-stopped \
  --memory 800m \
  --network observability_flex-monitor \
  -p 3002:3002 \
  -v "${VPS_DIR}/uploads:/app/uploads" \
  -v "${VPS_DIR}/images:/app/images" \
  --health-cmd='node -e "require(\"http\").get(\"http://localhost:\"+(process.env.PORT||3001)+\"/health\",r=>process.exit(r.statusCode===200?0:1))"' \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  -e NODE_ENV=production \
  -e PORT=3002 \
  -e LOG_LEVEL=info \
  -e MONGO_URI="mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims" \
  -e JWT_ACCESS_SECRET="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" \
  -e JWT_REFRESH_SECRET="f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1" \
  -e JWT_ACCESS_EXPIRES_IN=1h \
  -e JWT_REFRESH_EXPIRES_IN=7d \
  -e CORS_ORIGINS="https://acadily.com,https://www.acadily.com,https://app.acadily.com,https://api.acadily.com,https://health.acadily.com,http://localhost:3002" \
  -e RATE_LIMIT_WINDOW_MS=900000 \
  -e RATE_LIMIT_MAX=100000 \
  -e AUTH_RATE_LIMIT_MAX=10000 \
  -e OTP_RATE_LIMIT_MAX=1000 \
  -e SKIP_OTP=false \
  -e SMTP_USER=visualmediatechnology@gmail.com \
  -e SMTP_PASS=vdjojwhjxvhsgijt \
  -e SMTP_FROM=visualmediatechnology@gmail.com \
  -e USER_EMAIL=visualmediatechnology@gmail.com \
  -e USER_PASSWORD=vdjojwhjxvhsgijt \
  flex-academy-api:amd64

sleep 12
echo "[VPS] Container status:"
docker ps --format "{{.Names}}: {{.Status}}" | grep flex-academy-api

echo "[VPS] Cleaning up archive..."
rm "${VPS_DIR}/flex-academy-api-amd64.tar.gz"
REMOTE

# ── Step 5: Local cleanup + smoke test ───────────────────────────────────────
log "Cleaning up local archive..."
rm -f "${ARCHIVE}"

log "Waiting for health check..."
for i in $(seq 1 30); do
  if curl -sf "${HEALTH_URL}" >/dev/null 2>&1; then
    log "Health OK — deploy complete!"
    break
  fi
  if [ "$i" -eq 30 ]; then
    die "Health check timed out after 60s — check VPS logs: ssh root@66.116.207.89 'docker logs flex-academy-api --tail 50'"
  fi
  sleep 2
done

# ── Step 6: Verification ──────────────────────────────────────────────────────
log "Running daybook verification..."
TOKEN=$(curl -s -X POST https://app.acadily.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: ims_reliance" \
  -d '{"email":"aiinfox@aiinfox.com","password":"Lucky@9856"}' \
  | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

if [ -z "${TOKEN}" ]; then
  log "WARNING: Could not obtain auth token — skipping daybook check"
else
  curl -s \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-Tenant-Id: ims_reliance" \
    "https://app.acadily.com/api/dayBook/data" \
  | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
const C='68b9d092d6bc3d1f1b826847';
const f=d.filter(e=>e.companyId===C);
const t=f.reduce((s,e)=>s+(+e.credit||0)-(+e.debit||0)+(+e.studentLateFees||0),0);
console.log('[VERIFY] rows:',d.length,'VMA:',f.length,'Total:',t.toFixed(2));
if(t.toFixed(2)!=='1794270.00') { console.error('[WARN] Daybook total mismatch — expected 1794270.00'); process.exit(1); }
console.log('[VERIFY] Daybook total OK');
"
fi

log "Deploy complete. App: https://app.acadily.com"
