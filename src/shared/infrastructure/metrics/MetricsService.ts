import client, {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

const register = new Registry();

// Collect default Node.js metrics (CPU, memory, event loop, GC)
collectDefaultMetrics({ register, prefix: 'flex_' });

// ── HTTP Metrics ──

export const httpRequestDuration = new Histogram({
  name: 'flex_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'flex_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

export const httpRequestsInFlight = new Gauge({
  name: 'flex_http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  registers: [register],
});

// ── Auth Metrics ──

export const authAttemptsTotal = new Counter({
  name: 'flex_auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'result'] as const, // type: login|register|refresh, result: success|failure
  registers: [register],
});

// ── Business Metrics ──

export const activeStudentsGauge = new Gauge({
  name: 'flex_active_students',
  help: 'Number of active students',
  labelNames: ['tenant_id'] as const,
  registers: [register],
});

export const feeCollectionTotal = new Counter({
  name: 'flex_fee_collection_total',
  help: 'Total fee amount collected',
  labelNames: ['tenant_id', 'payment_method'] as const,
  registers: [register],
});

// ── Database Metrics ──

export const dbQueryDuration = new Histogram({
  name: 'flex_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const dbConnectionsGauge = new Gauge({
  name: 'flex_db_connections',
  help: 'Number of active database connections',
  labelNames: ['state'] as const, // connected, disconnected, connecting
  registers: [register],
});

// ── EWS Alert Metrics ──

export const ewsAlertsTotal = new Counter({
  name: 'flex_ews_alerts_total',
  help: 'Total EWS alerts fired',
  labelNames: ['severity', 'category'] as const, // severity: warn|critical|emergency
  registers: [register],
});

export { register, client };
