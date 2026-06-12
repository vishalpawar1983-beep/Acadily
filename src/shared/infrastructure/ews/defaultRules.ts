import mongoose from 'mongoose';
import type { AlertSeverity } from './EarlyWarningSystem.js';
// Metrics imports reserved for future business rules
// import { httpRequestsTotal, authAttemptsTotal } from '../metrics/MetricsService.js';

interface AlertResult {
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, unknown>;
}

// ── Infrastructure Rules ──

export function memoryUsageRule() {
  return {
    name: 'high_memory_usage',
    category: 'infrastructure' as const,
    intervalMs: 30_000, // every 30s
    check: async (): Promise<AlertResult | null> => {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const rssMB = Math.round(usage.rss / 1024 / 1024);

      // Atlas M0 free tier has limited memory — alert at 200MB RSS
      if (rssMB > 400) {
        return {
          severity: 'critical',
          message: `RSS memory at ${rssMB}MB (threshold: 400MB)`,
          metadata: { rssMB, heapUsedMB },
        };
      }
      if (rssMB > 200) {
        return {
          severity: 'warn',
          message: `RSS memory at ${rssMB}MB (threshold: 200MB)`,
          metadata: { rssMB, heapUsedMB },
        };
      }
      return null;
    },
  };
}

export function eventLoopLagRule() {
  let lastCheck = Date.now();

  return {
    name: 'event_loop_lag',
    category: 'infrastructure' as const,
    intervalMs: 5_000,
    check: async (): Promise<AlertResult | null> => {
      const now = Date.now();
      const expected = 5_000;
      const actual = now - lastCheck;
      const lagMs = actual - expected;
      lastCheck = now;

      if (lagMs > 2_000) {
        return {
          severity: 'critical',
          message: `Event loop lag: ${lagMs}ms (threshold: 2000ms)`,
          metadata: { lagMs },
        };
      }
      if (lagMs > 500) {
        return {
          severity: 'warn',
          message: `Event loop lag: ${lagMs}ms (threshold: 500ms)`,
          metadata: { lagMs },
        };
      }
      return null;
    },
  };
}

// ── Database Rules ──

export function mongoConnectionRule() {
  return {
    name: 'mongo_connection',
    category: 'infrastructure' as const,
    intervalMs: 15_000,
    check: async (): Promise<AlertResult | null> => {
      const state = mongoose.connection.readyState;
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (state === 0 || state === 3) {
        return {
          severity: 'critical',
          message: `MongoDB connection lost (state: ${state})`,
          metadata: { readyState: state },
        };
      }
      if (state === 2) {
        return {
          severity: 'warn',
          message: 'MongoDB still connecting',
          metadata: { readyState: state },
        };
      }
      return null;
    },
  };
}
