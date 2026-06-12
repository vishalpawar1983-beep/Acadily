# Phase 2 Completion Gate Checklist

> Status: NOT STARTED | Target: Week 9-12

## Metrics Collection
- [ ] prom-client installed and configured
- [ ] HTTP request duration histogram (by method, path, status, tenant)
- [ ] HTTP request counter (by method, status, tenant)
- [ ] Active connections gauge
- [ ] MongoDB connection pool metrics
- [ ] Business metrics: students_total, payments_total, payment_amount
- [ ] `/metrics` endpoint (Prometheus format, internal access only)
- [ ] Node.js default metrics (event loop lag, heap usage, GC)

## Grafana Dashboards
- [ ] Grafana Docker container running
- [ ] Prometheus data source configured
- [ ] Loki data source configured
- [ ] System Dashboard: CPU, Memory, Disk, Network
- [ ] Application Dashboard: Request rate, Error rate, Latency (p50/p95/p99)
- [ ] Business Dashboard: Students, Fees, Payments by tenant
- [ ] MongoDB Dashboard: Connections, Operations, Slow queries
- [ ] Dashboard accessible via Nginx proxy (`/grafana/`)
- [ ] Default admin password changed

## Log Aggregation
- [ ] Loki Docker container running
- [ ] Docker logging driver sending to Loki
- [ ] Grafana Explore view working with Loki
- [ ] Saved queries for: errors, auth failures, slow requests, per-tenant activity
- [ ] Log retention policy configured (30 days staging, 90 days production)

## Early Warning System (EWS)
- [ ] Grafana Alert Manager configured
- [ ] Notification channel: Slack webhook
- [ ] Notification channel: Email
- [ ] Infrastructure alerts configured and tested:
  - [ ] Disk > 80% (WARN)
  - [ ] Disk > 90% (CRITICAL)
  - [ ] Memory > 80% (WARN)
  - [ ] Memory > 90% (CRITICAL)
  - [ ] MongoDB health check fail (EMERGENCY)
  - [ ] Container restart loop (CRITICAL)
- [ ] Application alerts configured and tested:
  - [ ] Error rate > 5% (WARN)
  - [ ] Error rate > 15% (CRITICAL)
  - [ ] p95 latency > 2s (WARN)
  - [ ] Auth failures > 20/5min (WARN)
  - [ ] Health check fail (CRITICAL)
- [ ] Business alerts configured and tested:
  - [ ] Payment failures > 3 consecutive (WARN)
  - [ ] No tenant activity for 24h (INFO)
- [ ] Alert escalation rules defined
- [ ] Runbook entries for each alert
- [ ] Test drill: simulate each alert, verify notification

## In-App Alert Service
- [ ] AlertService implementation
- [ ] Memory usage check
- [ ] Event loop lag check
- [ ] MongoDB connectivity check
- [ ] Cooldown logic (no spam alerts)
- [ ] Alert history log

## Verification
- [ ] Grafana dashboards load with real data
- [ ] Alerts fire correctly on simulated conditions
- [ ] Slack receives alert notifications
- [ ] Email receives alert notifications
- [ ] Logs searchable in Grafana Explore
- [ ] Grep patterns from 07-LOGGING-AND-OBSERVABILITY.md work against live logs
- [ ] Dashboard shows per-tenant metrics correctly

## Sign-off
- [ ] All items above checked
- [ ] No performance degradation from metrics collection
- [ ] Documentation updated
- Approved by: _______________
- Date: _______________
