import { logger } from '../logger/PinoLogger.js';
import { ewsAlertsTotal } from '../metrics/MetricsService.js';

export type AlertSeverity = 'warn' | 'critical' | 'emergency';
export type AlertCategory = 'infrastructure' | 'application' | 'business' | 'security';

interface AlertRule {
  name: string;
  category: AlertCategory;
  check: () => Promise<AlertResult | null>;
  intervalMs: number;
}

interface AlertResult {
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, unknown>;
}

interface ActiveAlert {
  rule: string;
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  metadata?: Record<string, unknown>;
  triggeredAt: Date;
}

export class EarlyWarningSystem {
  private rules: AlertRule[] = [];
  private timers: NodeJS.Timeout[] = [];
  private activeAlerts: ActiveAlert[] = [];
  private webhookUrl?: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl;
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  start(): void {
    logger.info({ ruleCount: this.rules.length }, 'EWS starting alert monitors');

    for (const rule of this.rules) {
      const timer = setInterval(async () => {
        try {
          const result = await rule.check();
          if (result) {
            this.fireAlert(rule, result);
          } else {
            // Clear alert if it was active
            this.clearAlert(rule.name);
          }
        } catch (err) {
          logger.error({ rule: rule.name, err }, 'EWS rule check failed');
        }
      }, rule.intervalMs);

      this.timers.push(timer);
    }
  }

  stop(): void {
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers = [];
    logger.info('EWS stopped');
  }

  getActiveAlerts(): ReadonlyArray<ActiveAlert> {
    return this.activeAlerts;
  }

  private fireAlert(rule: AlertRule, result: AlertResult): void {
    // Avoid duplicate alerts for the same rule
    const existing = this.activeAlerts.find((a) => a.rule === rule.name);
    if (existing) return;

    const alert: ActiveAlert = {
      rule: rule.name,
      severity: result.severity,
      category: rule.category,
      message: result.message,
      metadata: result.metadata,
      triggeredAt: new Date(),
    };

    this.activeAlerts.push(alert);

    ewsAlertsTotal.inc({ severity: result.severity, category: rule.category });

    const logMethod = result.severity === 'emergency' ? 'fatal'
      : result.severity === 'critical' ? 'error'
      : 'warn';

    logger[logMethod](
      { alert: rule.name, severity: result.severity, category: rule.category, ...result.metadata },
      `EWS ALERT: ${result.message}`,
    );

    if (this.webhookUrl) {
      this.sendWebhook(alert).catch((err) => {
        logger.error({ err }, 'EWS webhook delivery failed');
      });
    }
  }

  private clearAlert(ruleName: string): void {
    const idx = this.activeAlerts.findIndex((a) => a.rule === ruleName);
    if (idx >= 0) {
      logger.info({ alert: ruleName }, 'EWS alert resolved');
      this.activeAlerts.splice(idx, 1);
    }
  }

  private async sendWebhook(alert: ActiveAlert): Promise<void> {
    if (!this.webhookUrl) return;

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `[${alert.severity.toUpperCase()}] ${alert.category}: ${alert.message}`,
          alert,
        }),
      });
    } catch {
      // Logged by caller
    }
  }
}
