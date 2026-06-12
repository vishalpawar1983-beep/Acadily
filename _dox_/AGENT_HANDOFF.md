# Agent Handoff — Flex Academy Portal Deployment Guide

> Read this first. Every gotcha here cost real debugging time.
> Last updated: 2026-05-01 (after dedup fix-up + payment-options createdBy resolution)

## TL;DR — Current State

- **Phase 3** (production cutover) **LIVE** at https://app.acadily.com
- **3 tenants** synced from VPS legacy DBs to Atlas dev: `ims_reliance`, `chanakya`, `webliquid`
- **Daily cron** at 03:17 UTC on VPS keeps Atlas in lockstep with all 3 legacy apps
- **Repo**: `bitbucket.org/aiinfox-wrk/ims-fullstack` (branch `main`)
- **Last verified deploy**: commit `4c38440` — daybook total ₹1,794,270 matches prod, paymentOptions resolves user names

---

## 1. Where Things Live

### Local
| Path | What |
|---|---|
| `/Users/aiinfox/Documents/Projects/Flex_Academy/Portal` | Repo root |
| `src/shared/infrastructure/middleware/legacyGateway.ts` | The Bridge — biggest, most-edited file |
| `scripts/data-sync/` | All migration + sync scripts (numbered 01-07 + helpers) |
| `_src_/ims-frontend-source/` | Legacy React frontend (reference; built into Docker) |
| `docker/Dockerfile` | Multi-stage: Node 18 frontend + Node 22 backend |
| `_dox_/XAR/prod-api-responses.json` | HAR — source of truth for 47 legacy endpoint shapes |
| `/Users/aiinfox/.claude/projects/.../memory/` | KB memory — read first for project state |

### VPS (`root@66.116.207.89` / pwd `zQ>iaRo`)
| Path | What |
|---|---|
| `/opt/flex-academy/` | Container working dir (volumes, configs, scripts, env) |
| `/opt/flex-academy/scripts/vps-daily-sync.cjs` | Multi-tenant daily sync (cron) |
| `/opt/flex-academy/.env.daily-sync` | Sync env (mode 600) |
| `/opt/flex-academy/uploads/`, `/images/` | Mounted into container |
| `/var/log/flex-daily-sync.log` | Cron output (logrotate weekly × 8) |
| `/var/www/{VMA,Chanakya1,webliquidStudio}/` | Legacy MERN apps (still active in Phase 3) |
| `/etc/nginx/sites-{available,enabled}/` | Reverse proxy configs |

### Production URLs
| URL | Purpose |
|---|---|
| https://app.acadily.com | Full app (frontend + DDD backend) |
| https://api.acadily.com | API / Swagger |
| https://health.acadily.com | Grafana (admin / `FlexAcademy@2026`) |
| https://acadily.com | Marketing landing |

### Live Data Sources (during Phase-3 coexistence)
| Tenant | VPS Mongo | Receipt Prefix |
|---|---|---|
| ims_reliance | `mongodb://imsapp:ims12345@127.0.0.1:27017/SchoolsStore?authSource=SchoolsStore` | `VM-` |
| chanakya | `mongodb://chanakyaapp:chanakya12345@127.0.0.1:27017/Chanakya?authSource=Chanakya` | `CCC-` |
| webliquid | `mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27017/webliquidStudio?authSource=admin` | `WS-` |
| All 3 | Atlas `flex_academy_dev` (read+write) | — |

### Atlas Dev DB (used by both local dev and app.acadily.com)
```
mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims
```

---

## 2. Deployment Runbook

### Standard "code change → live" loop

```bash
# 1. Type-check + build (must both pass clean)
npm run typecheck
npm run build

# 2. Build amd64 Docker image (run in background — takes 4-6 min)
docker buildx build --platform linux/amd64 -f docker/Dockerfile -t flex-academy-api:amd64 --load .

# 3. Save + transfer (image is ~115-120 MB gzipped)
docker save flex-academy-api:amd64 | gzip > /tmp/flex-academy-api-amd64.tar.gz
SSHPASS='zQ>iaRo' sshpass -e scp -o StrictHostKeyChecking=no \
  -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa \
  /tmp/flex-academy-api-amd64.tar.gz root@66.116.207.89:/opt/flex-academy/

# 4. Recreate container on VPS (rm + run, NOT restart — env vars need re-binding)
SSHPASS='zQ>iaRo' sshpass -e ssh -o StrictHostKeyChecking=no \
  -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa root@66.116.207.89 '
docker load < /opt/flex-academy/flex-academy-api-amd64.tar.gz
docker rm -f flex-academy-api
docker run -d --name flex-academy-api --restart unless-stopped --memory 800m \
  --network observability_flex-monitor -p 3002:3002 \
  -v /opt/flex-academy/uploads:/app/uploads -v /opt/flex-academy/images:/app/images \
  --health-cmd="node -e \"require(\\\"http\\\").get(\\\"http://localhost:\\\" + (process.env.PORT||3001) + \\\"/health\\\", r => process.exit(r.statusCode===200?0:1))\"" \
  --health-interval=30s --health-timeout=10s --health-retries=3 \
  -e NODE_ENV=production -e PORT=3002 -e LOG_LEVEL=info \
  -e MONGO_URI="mongodb+srv://designermanjeets_db_user:Wu2F9CJyBAROC5G8@cluster-ims.h10y328.mongodb.net/flex_academy_dev?retryWrites=true&w=majority&appName=Cluster-ims" \
  -e JWT_ACCESS_SECRET="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2" \
  -e JWT_REFRESH_SECRET="f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1" \
  -e JWT_ACCESS_EXPIRES_IN=1h -e JWT_REFRESH_EXPIRES_IN=7d \
  -e CORS_ORIGINS="https://acadily.com,https://www.acadily.com,https://app.acadily.com,https://api.acadily.com,https://health.acadily.com,http://localhost:3002" \
  -e RATE_LIMIT_WINDOW_MS=900000 -e RATE_LIMIT_MAX=100000 -e AUTH_RATE_LIMIT_MAX=10000 -e OTP_RATE_LIMIT_MAX=1000 \
  -e SKIP_OTP=false \
  -e SMTP_USER=visualmediatechnology@gmail.com -e SMTP_PASS=vdjojwhjxvhsgijt \
  -e SMTP_FROM=visualmediatechnology@gmail.com -e USER_EMAIL=visualmediatechnology@gmail.com -e USER_PASSWORD=vdjojwhjxvhsgijt \
  flex-academy-api:amd64
sleep 12
docker ps --format "{{.Names}}: {{.Status}}" | grep flex-academy-api
rm /opt/flex-academy/flex-academy-api-amd64.tar.gz
'
rm /tmp/flex-academy-api-amd64.tar.gz   # local cleanup

# 5. Smoke test
until curl -sf https://app.acadily.com/health > /dev/null 2>&1; do sleep 2; done
echo "Health OK"
```

### Run the build in background (Claude Code)

When using the Bash tool, run the `docker buildx build` with `run_in_background: true` and `ScheduleWakeup` for 270s — the build takes 4-6 min, blocking Claude wastes context. The wakeup prompt should re-read the output file and continue with save+scp+deploy.

### Verification after every deploy

```bash
TOKEN=$(curl -s -X POST https://app.acadily.com/api/v1/auth/login \
  -H "Content-Type: application/json" -H "X-Tenant-Id: ims_reliance" \
  -d '{"email":"aiinfox@aiinfox.com","password":"Lucky@9856"}' \
  | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

# Daybook total — must stay at prod's number
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-Id: ims_reliance" \
  "https://app.acadily.com/api/dayBook/data" \
| node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
const C='68b9d092d6bc3d1f1b826847';
const f=d.filter(e=>e.companyId===C);
const t=f.reduce((s,e)=>s+(+e.credit||0)-(+e.debit||0)+(+e.studentLateFees||0),0);
console.log('rows:',d.length,'VMA:',f.length,'Total:',t.toFixed(2));"

# Should print: rows: 1153 VMA: 319 Total: 1794270.00
```

---

## 3. Common Pitfalls (Read Before Editing)

These have all bitten us in production. Numbered to match the Confluence "Common Pitfalls" page (FA / 338853889).

### #1-10 (older, see Confluence): ObjectId types, _legacyId vs _id, companyName isn't a name, response wrapper inconsistency, React Query fires before login, JWT expiry, stale unique indexes, sort order, populated vs flat refs, HAR is source of truth.

### #11 — Migration mappers must write top-level fields (feepayments)

Mapper stored prod fields ONLY in `_raw`, but legacy endpoints read top-level `f.amountPaid`. Result: monthly-reports showed ₹0 instead of ₹96,890.

**Rule**: grep `legacyGateway.ts` for every field the endpoint reads from the target collection, mirror them at top level. `_raw` is for audit only.

### #12 — Receipt counter must be seeded to prod's max

`receiptcounters.currentValue` left at 2773 while prod was at 2793. New app-generated receipts collided with already-migrated docs (unique index `tenantId_1_receiptNumber_1`).

**Rule**: After any migration or import of feepayments, bump counter to source max BEFORE inserting. Daily sync does this automatically (`bumpReceiptCounter()` in `vps-daily-sync.cjs`).

### #13 — Student enrollment financials drift continuously

Prod legacy app updates `students.remainingCourseFees` etc. on every payment. Migration captures a snapshot. Dev becomes stale.

**Rule**: Daily cron re-syncs 8 fields: `remainingFees`, `totalPaid`, `netFees`, `installmentAmount`, `installmentCount`, `downPayment`, `discount`, `courseFees`. Don't add `dropOutStudent` to this list — it's handled separately and overwriting it can hide deliberate dev changes.

### #14 — `get-not-paid-students` logic must match prod exactly

```typescript
// Exclude dropouts: BOTH DDD status AND legacy flag
$nor: [
  { status: { $in: ["dropout", "dropped"] } },
  { dropOutStudent: true }
]
// Skip students with no payments
if (!lastPayment) continue;
// Month-diff math (NOT day-based)
const missingMonths = (now.getFullYear() - latestDate.getFullYear()) * 12
                   + (now.getMonth() - latestDate.getMonth());
if (missingMonths <= 0) continue;
// Use createdAt (system timestamp), NOT paymentDate (user-entered, unreliable)
// fromDate/toDate in body are IGNORED
```

### #15 — Migration mappers must write denormalized view fields (daybook)

Same root cause as #11, recurred for `daybookentries`. Frontend reads `rollNo`, `StudentName`, `reciptNumber`, `studentInfo`, `naretion` (typo) — migration mapper dropped all 5. 1730 entries had blank student columns.

**Backfill script**: `scripts/data-sync/07-backfill-daybook-student-fields.cjs` (idempotent, all-tenants).

### #16 — Daybook merge must dedup against existing entries

Legacy prod inserts BOTH a `coursefees` row AND a `daybookdatas` row when a fee is collected (sharing the same `reciptNumber`). The migration brings both over. If the gateway naively merges feepayments into the daybook response (to surface app-native fees post-cutover), it **double-counts every migrated student fee**.

**Rule**: When merging feepayments into daybook view, build a `Set` of `reciptNumber`s already in `daybookentries` and exclude any feepayment with a matching receipt. See `legacyGateway.ts` GET `/dayBook/data` handler.

### #17 — Healthcheck port hardcoding

Original Dockerfile had `HEALTHCHECK ... http://localhost:3001/...` but container runs with `PORT=3002`. Health check failed for 3.7 days while the API was perfectly fine.

**Rule**: Always use `process.env.PORT` in HEALTHCHECK. Current Dockerfile is fixed. When recreating containers via `docker run`, pass `--health-cmd` override to ensure it picks up the env var.

### #18 — `.env.daily-sync` overrides cmd-line APPLY=false

The cron script reads `APPLY=true` from `/opt/flex-academy/.env.daily-sync` AFTER process spawns. Cmd-line `APPLY=false /usr/bin/node ...` gets clobbered by the env file load.

**Rule**: To dry-run on VPS, edit the env file or comment out `APPLY=true`. Production cron always applies.

### #19 — `.claude/settings*.json` git churn

Every interactive session adds Bash command patterns to `.claude/settings.json` (project) and `.claude/settings.local.json` (auto-tracked). They conflict on every pull/push.

**Rule**: Before pull/rebase: `git stash push .claude/`. After: `git stash pop` then `git checkout --theirs .claude/settings.local.json`. Don't fight them; they're just permission allowlists.

### #20 — Onboarding-created batchcategory collides on `(tenantId, categoryName)`

When migrating a tenant, the source has a `companies` doc you want to insert with original `_id` for student references. But the onboarding script already created a batchcategory with the same `categoryName`, hitting the unique index.

**Rule**: `migrate-tenant.cjs` `patchBatchcategory()` does the right thing — if source `_id` already exists, skip; if same `categoryName`, just patch `_legacyId` onto existing doc; only insert (preserving `_id`) when neither match.

### #21 — Docker daemon off

`docker buildx build` exits with code 0 even when Docker isn't running (the buildx wrapper is shell-friendly), but the actual error appears in stderr: `Cannot connect to the Docker daemon`. Always `tail` the build output before assuming success — look for `naming to docker.io/library/...` near the end.

**Recovery**: `open -a Docker; until docker info > /dev/null 2>&1; do sleep 3; done`

### #22 — Orphan reporting (do NOT auto-delete)

When prod legacy app deletes a doc, dev still holds it by `_legacyId`. Daily cron's `detectOrphans()` reports but never auto-deletes — auto-deletion would cause data loss if prod deleted by accident.

**Manual cleanup**: `scripts/data-sync/06-archive-orphan-docs.cjs` (TENANT env, dry-run by default). Archives to `*_orphan_archive` collections (zero data loss), then deletes from live.

---

## 4. Data Migration / Sync Patterns

### One-time tenant migration

```bash
# Webliquid example
APPLY=true \
TENANT_ID=webliquid \
SOURCE_MONGO_URI='mongodb://webliquidStudio:webliquidStudio12345@127.0.0.1:27017/webliquidStudio?authSource=admin' \
node scripts/data-sync/migrate-tenant.cjs
```

Order matters (handled inside the script):
1. Patch `batchcategories` (insert source company or patch `_legacyId` onto onboarded doc)
2. Insert new `courses` (needed before students for course-id resolution)
3. Build `courseLegacyToDevId` map
4. Insert new `students` (with mapped courseId)
5. Backfill missing `companyName` on existing migrated students/feepayments
6. Sync 8 student financial fields from prod
7. Insert new `feepayments`
8. Insert new `feeinstallments`
9. Insert new `daybookaccounts`
10. Insert new `daybookentries`
11. Seed `receiptcounters` to prod's max receipt number

### Daily cron flow (on VPS, 03:17 UTC)

`/opt/flex-academy/scripts/vps-daily-sync.cjs` runs the same logic for all 3 tenants. Logs to `/var/log/flex-daily-sync.log`. Idempotent.

### Idempotency rules
- **Always check `_legacyId` presence** before inserting — migrated docs should never duplicate
- **Additive only** — never auto-update existing fields except: financial drift sync, `companyName` backfill (only when undefined), `_legacyId` patch on batchcategory (only when missing)
- **Never auto-delete** — orphans get reported, archived manually

---

## 5. Architecture Quick Reference

### Stack
- **Backend**: Node 22, TypeScript strict, ES modules, Express 4, Zod, Pino, Mongoose
- **Frontend**: Compiled CRA build from `_src_/ims-frontend-source/` (no source-level changes — only data + gateway)
- **DB**: Atlas M0 `flex_academy_dev` (multi-tenant via `tenantId` discriminator)
- **Process**: PM2 cluster (2 workers) inside Docker
- **Network**: Container on `observability_flex-monitor`, port 3002 → Nginx → public

### The Legacy Gateway (`src/shared/infrastructure/middleware/legacyGateway.ts`)
The bridge between the compiled legacy frontend (calls `/api/*`) and the new DDD backend (`/api/v1/*`).

Three handler types:
1. **Generic route mapper** (~80 entries) — URL rewrite + envelope strip
2. **Response transformer** — `id` → `_id`, etc.
3. **Direct MongoDB handler** (~20+) — for endpoints where DDD shape is too different

**Always check HAR before adding new handlers**: `_dox_/XAR/prod-api-responses.json`

### The 8 student financial fields (sync target)
| DDD path | Prod field |
|---|---|
| `enrollment.remainingFees` | `remainingCourseFees` |
| `enrollment.totalPaid` | `totalPaid` |
| `enrollment.netFees` | `netCourseFees` |
| `enrollment.installmentAmount` | `no_of_installments_amount` |
| `enrollment.installmentCount` | `no_of_installments` |
| `enrollment.downPayment` | `down_payment` |
| `enrollment.discount` | `discount` |
| `enrollment.courseFees` | `course_fees` |

### Tenant onboarding
`scripts/onboard-tenant.py` — creates tenant + SuperAdmin + default company + 6 RBAC roles + counters. Idempotent (aborts on duplicates). Used for fresh tenants (no legacy data) like `flex_academy` and `demo_acadily`.

---

## 6. Troubleshooting

### "Daybook total wrong on app.acadily.com"
1. Check dev vs prod parity: `node scripts/data-sync/06-archive-orphan-docs.cjs` (dry-run, shows orphan counts)
2. If orphan count > 0 → archive (`APPLY=true ... TENANT=ims_reliance`)
3. If totals still off → check `legacyGateway.ts` GET `/dayBook/data` for missing dedup or new fields the frontend reads (Pitfall #15, #16)

### "Student fields blank on a viewer"
Pitfall #15. Run backfill script 07. If new field, extend the mapper in BOTH `migrate-tenant.cjs` and `vps-daily-sync.cjs` (mapDaybookEntry / mapStudent / etc.) AND the matching gateway handler.

### "Receipt collision when creating new fee"
Pitfall #12. Bump receipt counter:
```js
db.receiptcounters.updateOne(
  { tenantId: 'ims_reliance' },
  { $set: { currentValue: 2999, prefix: 'VM' } }  // some value > prod's max
)
```
Daily cron also auto-bumps before any insert.

### "Container shows unhealthy but API works"
Pitfall #17. Healthcheck port mismatch. Already fixed in Dockerfile, but if running an older image, recreate with `--health-cmd` override (see deploy runbook).

### "Cron not running"
```bash
# Verify daemon
ssh root@66.116.207.89 'systemctl is-active cron'
# Check crontab
ssh root@66.116.207.89 'crontab -l | grep vps-daily-sync'
# Tail recent runs
ssh root@66.116.207.89 'tail -100 /var/log/flex-daily-sync.log'
```

### "Push rejected (non-fast-forward)"
Someone else pushed:
```bash
git stash push .claude/ -m "auto-perms"
git pull --rebase origin main
git push origin main
git stash pop
git checkout --theirs .claude/settings.local.json   # if conflicted
```

### "MCP Confluence tools not loaded"
The MCP server starts at session start. If tools aren't available, restart Claude Code. Token in `~/.claude/settings.json` is `claude-mcp-2026` (created 2026-04-26, expires 2027-04-26).

---

## 7. Confluence — FA Space (`aiinfox-ai.atlassian.net/wiki/spaces/FA`)

| Page | ID | What |
|---|---|---|
| Common Pitfalls & Gotchas | 338853889 | All numbered pitfalls (currently #1-15, may need #16-22 added) |
| Data Migration — Prod to Dev | 338722836 | Full migration story, 3 tenants |
| Daily Prod→Dev Sync (Phase 3) | 360513544 | Cron details, schedule, scripts |
| Operations & Infrastructure | 338722856 | Phase status, observability |
| Legacy Gateway — The Bridge Layer | 338395140 | Gateway architecture |

Update Confluence pages after major changes via MCP `mcp__claude_ai_Atlassian__updateConfluencePage` (markdown contentFormat). Pages 338853889 and 360513544 are the most-touched.

---

## 8. Credentials Quick-Reference

| Service | Where |
|---|---|
| App login (SuperAdmin, ims_reliance) | `aiinfox@aiinfox.com / Lucky@9856` |
| VPS SSH | `root@66.116.207.89 / zQ>iaRo` (via sshpass) |
| Atlas Mongo | in `MONGO_URI` env vars (creds: `designermanjeets_db_user / Wu2F9CJyBAROC5G8`) |
| VPS Mongo (legacy) | per-tenant URIs in this doc, section 1 |
| SMTP | `visualmediatechnology@gmail.com / vdjojwhjxvhsgijt` (rotate via Gmail app passwords if revoked) |
| Atlassian API token | `claude-mcp-2026` in `~/.claude/settings.json` |
| Bitbucket app password | in `~/.claude/settings.json` (workspace-scoped, read+write) |
| Grafana | `admin / FlexAcademy@2026` |

---

## 9. Conventions This Project Already Follows

- **TypeScript strict**, ES modules, no `any` in domain layers
- **Tenant-scoped queries** — every `find/update` filters by `tenantId`
- **`_legacyId`** on every migrated doc = source `_id`
- **Pino structured JSON logs**, never `console.log` in app code
- **Idempotent scripts** — every `scripts/data-sync/*.cjs` accepts `APPLY=true` (dry-run by default)
- **Commit format**: `type(scope): description`, body with bullet points
- **Co-Authored-By line** with Claude model + 1M context tag (project convention)
- **`docker rm + docker run`** (NOT `docker restart`) when env vars change

---

## 10. When You're Done Working

1. `git status --short` — confirm only intended files changed
2. `git stash push .claude/` (the auto-perms churn) before commit
3. Commit with proper message format
4. `git push origin main`
5. Confluence: update Pitfalls page if a new gotcha was found
6. KB memory: update `/Users/aiinfox/.claude/projects/.../memory/` if a new persistent fact emerged
7. If the cron logic changed: `scp` the updated `vps-daily-sync.cjs` to `/opt/flex-academy/scripts/`
8. Verify post-deploy: daybook total ₹1,794,270, paymentOptions resolved names, /health 200

---

## Last 10 Commits (for context)

```
4c38440 fix(payment-options): resolve createdBy user ID to full name in GET response
7425059 fix(payment-options): make createdBy optional, fallback to authenticated user
8cbbc28 fix(daybook): dedup feepayments against daybookentries to prevent double-count
66c2dae fix: course update 404, daybook companyId filter, auth splash screen, ascending sort
025e54a fix(orphans): extend archive script to cover students + daybookentries
eca66f2 fix(daybook): backfill missing student fields, expose naretion alias in API
dff4ffa fix(docker): healthcheck now uses PORT env var (was hardcoded to 3001)
0b2f4a8 fix(data-sync): extend daily cron to sync ALL collections, not just feepayments
bbd0527 set seprate gmail conf for all companies
eb4282e feat(data-sync): migrate chanakya + webliquid tenants, add daily prod→dev cron
ddcc751 fix(reports): align dev with prod for monthly collection + not-paid screens
```
