import mongoose from 'mongoose';

interface HealthCheck {
  status: 'ok' | 'fail' | 'warn';
  latency?: number;
  error?: string;
  usedPercent?: number;
}

interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  version: string;
  checks?: Record<string, HealthCheck>;
}

export class HealthCheckService {
  private readonly startTime = Date.now();

  liveness(): HealthResponse {
    return {
      status: 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  async readiness(): Promise<HealthResponse> {
    const checks: Record<string, HealthCheck> = {};

    // MongoDB check
    const mongoStart = Date.now();
    try {
      if (mongoose.connection.readyState !== 1) {
        checks.mongodb = { status: 'fail', error: 'Not connected' };
      } else {
        await mongoose.connection.db!.admin().ping();
        checks.mongodb = { status: 'ok', latency: Date.now() - mongoStart };
      }
    } catch (err) {
      checks.mongodb = {
        status: 'fail',
        error: err instanceof Error ? err.message : 'Unknown error',
        latency: Date.now() - mongoStart,
      };
    }

    // Memory check (process RSS — actual memory consumed by this process)
    const rss = process.memoryUsage.rss();
    const rssMB = Math.round(rss / 1024 / 1024);
    const maxRssMB = 400; // aligned with PM2 max_memory_restart
    const rssPercent = Math.round((rssMB / maxRssMB) * 100);
    checks.memory = {
      status: rssPercent > 90 ? 'fail' : rssPercent > 80 ? 'warn' : 'ok',
      usedPercent: rssPercent,
    };

    // Heap check
    const heap = process.memoryUsage();
    const heapPercent = Math.round((heap.heapUsed / heap.heapTotal) * 100);
    checks.heap = {
      status: heapPercent > 90 ? 'fail' : heapPercent > 80 ? 'warn' : 'ok',
      usedPercent: heapPercent,
    };

    const hasFailure = Object.values(checks).some((c) => c.status === 'fail');
    const hasWarning = Object.values(checks).some((c) => c.status === 'warn');

    return {
      status: hasFailure ? 'down' : hasWarning ? 'degraded' : 'ok',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };
  }
}
