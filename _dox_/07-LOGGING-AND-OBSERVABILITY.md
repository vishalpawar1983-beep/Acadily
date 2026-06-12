# 07 - Logging & Observability Specification

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## Logger: Pino (JSON, Grep-Enabled from Day 1)

### Why Pino
- 5x faster than Winston (benchmarked)
- Native JSON output (structured, grep-able)
- Low overhead in production
- Built-in serializers for Express
- Child loggers for context propagation (tenantId, userId, correlationId)

### Log Format

Every log line is a single JSON object. This is the contract — never break it.

```json
{
  "level": 30,
  "time": 1709827200000,
  "pid": 1234,
  "hostname": "flex-academy-api-1",
  "correlationId": "req-abc123-def456",
  "tenantId": "chanakya",
  "userId": "user_789",
  "module": "fees",
  "action": "payment.received",
  "msg": "Payment received for student",
  "data": {
    "studentId": "stu_123",
    "amount": 15000,
    "installmentNumber": 3
  },
  "duration": 45,
  "httpMethod": "POST",
  "httpPath": "/api/v1/fees/payment",
  "httpStatus": 200,
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100"
}
```

### Log Levels

| Level | Value | When to Use |
|-------|-------|-------------|
| fatal | 60 | App is crashing, unrecoverable |
| error | 50 | Operation failed, needs attention |
| warn | 40 | Unusual but handled (rate limit hit, deprecated API) |
| info | 30 | Normal operations (request served, payment processed) |
| debug | 20 | Development detail (query params, intermediate results) |
| trace | 10 | Fine-grained detail (function entry/exit) |

**Production**: `info` and above
**Staging**: `debug` and above
**Development**: `trace` and above

### Grep Patterns (Common Operations)

```bash
# All errors in last hour
cat app.log | jq 'select(.level >= 50)'

# All requests for a specific tenant
grep '"tenantId":"chanakya"' app.log | jq .

# Failed payments
grep '"action":"payment.failed"' app.log | jq .

# Slow requests (>1 second)
cat app.log | jq 'select(.duration > 1000)'

# Trace a specific request across all logs
grep '"correlationId":"req-abc123"' app.log | jq .

# All auth failures
grep '"action":"auth.failed"' app.log | jq '{time: .time, ip: .ip, tenantId: .tenantId}'

# Error rate by module (last 1000 lines)
tail -1000 app.log | jq 'select(.level >= 50) | .module' | sort | uniq -c | sort -rn

# Response time percentiles
cat app.log | jq 'select(.duration != null) | .duration' | sort -n | awk '{a[NR]=$1} END {print "p50:", a[int(NR*0.5)], "p95:", a[int(NR*0.95)], "p99:", a[int(NR*0.99)]}'
```

### Logger Implementation

```typescript
// src/shared/infrastructure/logger/PinoLogger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'password', 'token', 'secret', '*.password'],
    censor: '[REDACTED]'
  }
});

export { logger };

// Create child logger with request context
export function createRequestLogger(req: Request) {
  return logger.child({
    correlationId: req.correlationId,
    tenantId: req.tenantContext?.tenantId,
    userId: req.user?.id,
    httpMethod: req.method,
    httpPath: req.path,
  });
}
```

### Correlation ID Middleware

```typescript
// Every request gets a unique ID that flows through all logs
import { randomUUID } from 'crypto';

export function correlationIdMiddleware(req, res, next) {
  req.correlationId = req.headers['x-correlation-id'] || randomUUID();
  res.setHeader('X-Correlation-Id', req.correlationId);
  next();
}
```

### Request Logging Middleware

```typescript
export function requestLogger(req, res, next) {
  const start = Date.now();
  const log = createRequestLogger(req);

  // Log request start
  log.info({ action: 'request.start' }, `${req.method} ${req.path}`);

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logFn = res.statusCode >= 500 ? log.error : res.statusCode >= 400 ? log.warn : log.info;

    logFn.call(log, {
      action: 'request.complete',
      httpStatus: res.statusCode,
      duration,
    }, `${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}
```

## Health Checks

### Endpoints

#### `GET /health` (Liveness)
Returns 200 if the process is alive. No dependency checks.

```json
{
  "status": "ok",
  "uptime": 3600,
  "timestamp": "2026-03-07T12:00:00Z",
  "version": "1.0.0"
}
```

#### `GET /ready` (Readiness)
Returns 200 only if all dependencies are healthy.

```json
{
  "status": "ok",
  "checks": {
    "mongodb": { "status": "ok", "latency": 5 },
    "disk": { "status": "ok", "usedPercent": 22 },
    "memory": { "status": "ok", "usedPercent": 45 }
  },
  "timestamp": "2026-03-07T12:00:00Z"
}
```

Returns 503 if any check fails:
```json
{
  "status": "degraded",
  "checks": {
    "mongodb": { "status": "fail", "error": "Connection timeout" },
    "disk": { "status": "ok", "usedPercent": 22 },
    "memory": { "status": "warn", "usedPercent": 82 }
  }
}
```

## Metrics (Prometheus)

### Application Metrics (prom-client)

```typescript
// Request duration histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status', 'tenantId'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

// Request counter
const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status', 'tenantId']
});

// Active connections gauge
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Business metrics
const studentsTotal = new Gauge({
  name: 'students_total',
  help: 'Total students per tenant',
  labelNames: ['tenantId', 'status']
});

const paymentsTotal = new Counter({
  name: 'payments_total',
  help: 'Total payments processed',
  labelNames: ['tenantId', 'status', 'method']
});

const paymentAmount = new Histogram({
  name: 'payment_amount',
  help: 'Payment amounts',
  labelNames: ['tenantId'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000]
});
```

### Metrics Endpoint
`GET /metrics` - Prometheus scrape endpoint (protected, internal only)

## Dashboard Panels (Grafana)

### System Dashboard
1. CPU Usage (%)
2. Memory Usage (%) + trend
3. Disk Usage (%) + trend
4. Network I/O
5. Docker container status
6. MongoDB connections + ops/sec

### Application Dashboard
1. Request Rate (req/sec) by tenant
2. Error Rate (%) by tenant
3. Response Time (p50, p95, p99)
4. Top 10 slowest endpoints
5. Error breakdown by type/endpoint
6. Active users (concurrent)

### Business Dashboard
1. Active Students by tenant
2. Fee Collection (today/week/month) by tenant
3. Pending Fees amount by tenant
4. Attendance Rate by batch
5. New Enrollments trend
6. Payment Success/Failure ratio

## Log Aggregation

### Option A: Loki + Grafana (RECOMMENDED for this scale)
- Lightweight, designed for logs
- Integrates directly with Grafana
- Docker log driver support
- ~200MB RAM overhead

### Option B: ELK Stack
- Overkill for current scale
- Elasticsearch alone needs 1-2GB RAM
- Reserve for when exceeding 10 tenants

### Loki Configuration
```yaml
# Docker log driver sends to Loki
# docker-compose.yml
services:
  api:
    logging:
      driver: loki
      options:
        loki-url: "http://localhost:3200/loki/api/v1/push"
        labels: "app=flex-academy,env=staging"
```
