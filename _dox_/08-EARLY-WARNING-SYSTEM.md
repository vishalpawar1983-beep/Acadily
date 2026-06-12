# 08 - Early Warning System (EWS)

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## Overview

The EWS is a multi-layered alert system that detects problems BEFORE they become outages. It operates on three tiers: Infrastructure, Application, and Business.

## Alert Severity Levels

| Level | Color | Response Time | Notification Channel | Escalation |
|-------|-------|--------------|---------------------|-----------|
| INFO | Blue | Next business day | Dashboard only | None |
| WARN | Yellow | 4 hours | Slack/Discord + Dashboard | None |
| CRITICAL | Orange | 1 hour | Slack + Email + Dashboard | Auto-escalate after 30min |
| EMERGENCY | Red | Immediate | Slack + Email + SMS + Dashboard | Page on-call |

## Alert Rules

### Tier 1: Infrastructure Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Disk Almost Full | disk_usage > 80% | WARN | Clean up logs/images |
| Disk Critical | disk_usage > 90% | CRITICAL | Immediate cleanup |
| Memory High | mem_usage > 80% | WARN | Investigate leaks |
| Memory Critical | mem_usage > 90% | CRITICAL | Restart containers |
| CPU Sustained | cpu_usage > 85% for 5min | WARN | Check for runaway queries |
| MongoDB Down | health_check.mongodb = fail | EMERGENCY | DB recovery procedure |
| MongoDB Slow | avg_query_time > 500ms | WARN | Check indexes |
| MongoDB Connections | connections > 80% of max | CRITICAL | Connection pool review |
| Docker Container Restart | restart_count > 3 in 10min | CRITICAL | Check logs for crash loop |
| SSL Certificate Expiry | days_until_expiry < 14 | WARN | Renew certificate |

### Tier 2: Application Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Error Rate Spike | error_rate > 5% in 5min | WARN | Check error logs |
| Error Rate Critical | error_rate > 15% in 5min | CRITICAL | Investigate + possible rollback |
| Latency Degradation | p95_latency > 2s for 5min | WARN | Profile slow endpoints |
| Latency Critical | p95_latency > 5s for 5min | CRITICAL | Scale or optimize |
| PM2 Restart Loop | pm2_restarts > 5 in 10min | CRITICAL | Check crash logs |
| Unhandled Rejection | unhandled_promise_rejection | ERROR | Fix in next deploy |
| Health Check Fail | /ready returns 503 | CRITICAL | Check dependencies |
| Auth Failures Spike | auth_failures > 20 in 5min | WARN | Possible brute force |
| Auth Failures Critical | auth_failures > 50 in 5min | CRITICAL | Enable lockout |

### Tier 3: Business Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Payment Failure | payment_failures > 3 consecutive | WARN | Check Easebuzz status |
| Payment Gateway Down | all_payments_failing for 5min | CRITICAL | Notify tenants |
| No Activity | tenant has 0 API calls for 24h | INFO | Check if expected |
| Fee Collection Anomaly | daily_collection < 50% of 7day_avg | WARN | Verify with tenant |
| Mass Email Failure | email_failures > 10 in 1hr | WARN | Check SMTP credentials |
| Data Growth Spike | collection_size_growth > 200% in 24h | WARN | Check for spam/abuse |

## Implementation Architecture

```
┌──────────────────────────────────────────────┐
│              Application Logs                 │
│         (Pino JSON → stdout)                  │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│              Loki (Log Store)                 │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│         Grafana Alert Manager                 │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │  Alert Rules (Loki queries)             │ │
│  │  + Prometheus metric queries            │ │
│  └──────────────┬──────────────────────────┘ │
│                 │                             │
│  ┌──────────────▼──────────────────────────┐ │
│  │  Notification Channels                  │ │
│  │  - Slack Webhook                        │ │
│  │  - Email (SMTP)                         │ │
│  │  - Custom Webhook (for SMS)             │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## In-App Alert Service (Complement to Grafana)

For real-time alerting without Grafana dependency:

```typescript
// src/shared/infrastructure/alerts/AlertService.ts

interface AlertRule {
  name: string;
  check: () => Promise<AlertResult>;
  interval: number;        // Check every N seconds
  severity: 'info' | 'warn' | 'critical' | 'emergency';
  cooldown: number;        // Don't re-alert for N seconds
  channels: AlertChannel[];
}

interface AlertResult {
  triggered: boolean;
  value: number;
  threshold: number;
  message: string;
}

// Built-in checks
const builtInRules: AlertRule[] = [
  {
    name: 'memory_usage',
    check: async () => {
      const used = process.memoryUsage();
      const heapPercent = (used.heapUsed / used.heapTotal) * 100;
      return {
        triggered: heapPercent > 85,
        value: heapPercent,
        threshold: 85,
        message: `Heap usage at ${heapPercent.toFixed(1)}%`
      };
    },
    interval: 60,
    severity: 'warn',
    cooldown: 300,
    channels: ['slack', 'dashboard']
  },
  {
    name: 'event_loop_lag',
    check: async () => {
      const lag = await measureEventLoopLag();
      return {
        triggered: lag > 100,
        value: lag,
        threshold: 100,
        message: `Event loop lag at ${lag}ms`
      };
    },
    interval: 30,
    severity: 'warn',
    cooldown: 120,
    channels: ['slack']
  }
];
```

## Notification Templates

### Slack Message Format
```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": ":warning: WARN: Memory High" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Server:* flex-academy-api" },
        { "type": "mrkdwn", "text": "*Tenant:* All" },
        { "type": "mrkdwn", "text": "*Value:* 82% (threshold: 80%)" },
        { "type": "mrkdwn", "text": "*Time:* 2026-03-07 14:30:00 UTC" }
      ]
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "*Action:* Investigate memory usage. Check for leaks in recent deployments." }
    },
    {
      "type": "actions",
      "elements": [
        { "type": "button", "text": { "type": "plain_text", "text": "View Dashboard" }, "url": "http://66.116.207.89:3100/d/app" },
        { "type": "button", "text": { "type": "plain_text", "text": "View Logs" }, "url": "http://66.116.207.89:3100/explore" }
      ]
    }
  ]
}
```

## Runbook References

Each alert links to a runbook entry:

| Alert | Runbook |
|-------|---------|
| MongoDB Down | Check `systemctl status mongod`, check disk space, check logs at `/var/log/mongodb/mongod.log` |
| Memory Critical | Run `docker stats`, check for memory leaks with `--inspect`, restart container |
| Error Rate Spike | Check recent deployments, grep logs for new error patterns, rollback if needed |
| PM2 Restart Loop | `pm2 logs --err`, check for unhandled exceptions, check MongoDB connectivity |
| Payment Gateway Down | Check Easebuzz status page, verify API keys, test with curl |

## Alert Testing

Monthly alert drill:
1. Simulate each alert condition
2. Verify notification reaches correct channel
3. Verify runbook is accurate
4. Measure response time
5. Update rules if false positive rate > 10%
