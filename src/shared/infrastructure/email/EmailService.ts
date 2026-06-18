import nodemailer from 'nodemailer';
import { config } from '../../../config/index.js';
import { logger } from '../logger/PinoLogger.js';
import { TemplateEngine } from './TemplateEngine.js';
import { EmailLogModel } from '../../../modules/email-logs/infrastructure/EmailLogModel.js';
import { TenantSettingsModel } from '../../../modules/settings/infrastructure/TenantSettingsModel.js';

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  tenantId?: string;
  sentBy?: string;
  /** Override the from address for this send. Defaults to tenant SMTP from, or global. */
  from?: string;
}

export interface TemplatedEmailOptions extends EmailOptions {
  variables?: Record<string, unknown>;
}

interface CachedTransporter {
  transporter: nodemailer.Transporter;
  from: string;
  user: string;
  expiresAt: number;
}

const TENANT_SMTP_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * EmailService — supports per-tenant SMTP with global fallback.
 *
 * Tenant SMTP config is read from TenantSettings.smtp (set via PUT /api/v1/settings/smtp).
 * Falls back to global env (SMTP_USER/SMTP_PASS or USER_EMAIL/USER_PASSWORD) when:
 *   - options.tenantId is not provided, OR
 *   - tenant has no smtp config saved in TenantSettings
 *
 * Tenant transporters are cached for 5 minutes.
 */
export class EmailService {
  private globalTransporter: nodemailer.Transporter | null = null;
  private globalFrom = 'noreply@flexacademy.com';
  private globalUser = '';
  private tenantCache = new Map<string, CachedTransporter>();

  constructor() {
    const smtpUser = config.SMTP_USER || process.env.USER_EMAIL;
    const smtpPass = config.SMTP_PASS || process.env.USER_PASSWORD;
    const smtpFrom = config.SMTP_FROM || smtpUser || 'noreply@flexacademy.com';

    if (smtpUser && smtpPass) {
      this.globalTransporter = nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      });
      this.globalFrom = smtpFrom;
      this.globalUser = smtpUser;
    } else {
      logger.warn(
        'No global SMTP credentials configured (SMTP_USER/SMTP_PASS or USER_EMAIL/USER_PASSWORD). ' +
        'Emails will only be sent for tenants with their own smtp config.',
      );
    }
  }

  /** Get a tenant-specific transporter from TenantSettings, with 5-min cache. */
  private async getTenantTransporter(tenantId: string): Promise<CachedTransporter | null> {
    const cached = this.tenantCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) return cached;

    try {
      const settings = await TenantSettingsModel.findOne(
        { tenantId },
        { smtp: 1 },
      ).lean();

      const smtp = settings?.smtp;
      if (!smtp?.user || !smtp?.pass) return null;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        auth: { user: smtp.user, pass: smtp.pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      });

      const entry: CachedTransporter = {
        transporter,
        from: smtp.from || smtp.user,
        user: smtp.user,
        expiresAt: Date.now() + TENANT_SMTP_CACHE_TTL_MS,
      };
      this.tenantCache.set(tenantId, entry);
      logger.info({ tenantId, smtpUser: smtp.user }, 'Tenant SMTP transporter loaded');
      return entry;
    } catch (err) {
      logger.error({ err, tenantId }, 'Failed to load tenant SMTP config — falling back to global');
      return null;
    }
  }

  /** Invalidate cached transporter for a tenant (call after updating SMTP settings). */
  invalidateTenantCache(tenantId: string): void {
    this.tenantCache.delete(tenantId);
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      const recipientList = Array.isArray(options.to) ? options.to : [options.to];
      const recipients = recipientList.join(', ');

      // Resolve transporter: tenant-specific → global fallback
      let transporter: nodemailer.Transporter | null = this.globalTransporter;
      let from = this.globalFrom;
      let resolvedSender = this.globalUser;
      let usedTenantSmtp = false;

      if (options.tenantId) {
        const tenantSmtp = await this.getTenantTransporter(options.tenantId);
        if (tenantSmtp) {
          transporter = tenantSmtp.transporter;
          from = tenantSmtp.from;
          resolvedSender = tenantSmtp.user;
          usedTenantSmtp = true;
        }
      }

      if (options.from) from = options.from;

      if (!transporter) {
        logger.error(
          { tenantId: options.tenantId, to: recipients },
          'Cannot send email — no SMTP credentials configured (neither tenant nor global)',
        );
        return false;
      }

      const ccList = options.cc
        ? (Array.isArray(options.cc) ? options.cc : [options.cc]).filter(Boolean)
        : [];
      await transporter.sendMail({
        from,
        to: recipients,
        ...(ccList.length ? { cc: ccList.join(', ') } : {}),
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info(
        { to: recipients, subject: options.subject, tenantId: options.tenantId, sender: resolvedSender, smtp: usedTenantSmtp ? 'tenant' : 'global' },
        'Email sent successfully',
      );

      if (options.tenantId) {
        const log = await EmailLogModel.create({
          tenantId: options.tenantId,
          recipients: recipientList,
          subject: options.subject,
          content: options.html || options.text || '',
          sender: options.sentBy || resolvedSender,
          sentAt: new Date(),
          status: 'sent',
        });
        logger.debug({ logId: log._id.toString(), tenantId: options.tenantId }, 'Email log saved');
      } else {
        logger.warn({ subject: options.subject }, 'Email sent but not logged — tenantId missing');
      }

      return true;
    } catch (err) {
      logger.error({ err, to: options.to, subject: options.subject, tenantId: options.tenantId }, 'Failed to send email');
      return false;
    }
  }

  async sendTemplated(options: TemplatedEmailOptions): Promise<boolean> {
    const variables = options.variables ?? {};
    const compiledSubject = TemplateEngine.compile(options.subject, variables);
    const compiledText = options.text
      ? TemplateEngine.compile(options.text, variables)
      : undefined;
    const compiledHtml = options.html
      ? TemplateEngine.compile(options.html, variables)
      : undefined;

    return this.send({
      to: options.to,
      subject: compiledSubject,
      text: compiledText,
      html: compiledHtml,
      tenantId: options.tenantId,
      sentBy: options.sentBy,
      from: options.from,
    });
  }
}
