import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { config } from "./config/index.js";
import { logger } from "./shared/infrastructure/logger/PinoLogger.js";
import { correlationIdMiddleware } from "./shared/infrastructure/middleware/correlationId.js";
import { requestLoggerMiddleware } from "./shared/infrastructure/middleware/requestLogger.js";
import { globalRateLimiter } from "./shared/infrastructure/middleware/rateLimiter.js";
import { tenantResolverMiddleware } from "./shared/infrastructure/middleware/tenantResolver.js";
import { errorHandler } from "./shared/infrastructure/middleware/errorHandler.js";
import { HealthCheckService } from "./shared/infrastructure/health/HealthCheckService.js";
import { metricsMiddleware } from "./shared/infrastructure/middleware/metricsMiddleware.js";
import { register } from "./shared/infrastructure/metrics/MetricsService.js";
import { EarlyWarningSystem } from "./shared/infrastructure/ews/EarlyWarningSystem.js";
import {
  memoryUsageRule,
  eventLoopLagRule,
  mongoConnectionRule,
} from "./shared/infrastructure/ews/defaultRules.js";
import type { AppRequest } from "./shared/types/RequestContext.js";
import { authRouter } from "./modules/auth/interface/AuthRouter.js";
import { userRouter } from "./modules/auth/interface/UserRouter.js";
import { tenantRouter } from "./modules/tenant/interface/TenantRouter.js";
import { studentRouter } from "./modules/student/interface/StudentRouter.js";
import { courseRouter } from "./modules/course/interface/CourseRouter.js";
import { feeRouter } from "./modules/fees/interface/FeeRouter.js";
import { attendanceRouter } from "./modules/attendance/interface/AttendanceRouter.js";
import { teacherRouter } from "./modules/teacher/interface/TeacherRouter.js";
import { batchRouter } from "./modules/batch/interface/BatchRouter.js";
import { rbacRouter } from "./modules/rbac/interface/RbacRouter.js";
import { marksRouter } from "./modules/marks/interface/MarksRouter.js";
import { completionRouter } from "./modules/completion/interface/CompletionRouter.js";
import { installmentRouter } from "./modules/installments/interface/InstallmentRouter.js";
import { receiptRouter } from "./modules/receipt/interface/ReceiptRouter.js";
import { dayBookRouter } from "./modules/daybook/interface/DayBookRouter.js";
import { noteRouter } from "./modules/notes/interface/NoteRouter.js";
import { issueRouter } from "./modules/issues/interface/IssueRouter.js";
import { approvalRouter } from "./modules/approval/interface/ApprovalRouter.js";
import { paymentOptionRouter } from "./modules/payment-options/interface/PaymentOptionRouter.js";
import { customFormRouter } from "./modules/custom-forms/interface/CustomFormRouter.js";
import { customFieldRouter } from "./modules/custom-fields/interface/CustomFieldRouter.js";
import { formLayoutRouter } from "./modules/form-layout/interface/FormLayoutRouter.js";
import { emailTemplateRouter } from "./modules/email-templates/interface/EmailTemplateRouter.js";
import { labRouter } from "./modules/lab/interface/LabRouter.js";
import { timingRouter } from "./modules/timing/interface/TimingRouter.js";
import { profileRouter } from "./modules/profile/interface/ProfileRouter.js";
import { commissionRouter } from "./modules/commission/interface/CommissionRouter.js";
import { rollNumberRouter } from "./modules/roll-number/interface/RollNumberRouter.js";
import { settingsRouter } from "./modules/settings/interface/SettingsRouter.js";
import { paymentGatewayRouter } from "./modules/payment-gateway/interface/PaymentGatewayRouter.js";
import { subjectRouter } from "./modules/subjects/interface/SubjectRouter.js";
import { categoryRouter } from "./modules/categories/interface/CategoryRouter.js";
import { courseTypeRouter } from "./modules/course-types/interface/CourseTypeRouter.js";
import { numberOfYearsRouter } from "./modules/number-of-years/interface/NumberOfYearsRouter.js";
import { emailLogRouter } from "./modules/email-logs/interface/EmailLogRouter.js";
import { batchCategoryRouter } from "./modules/batch-categories/interface/BatchCategoryRouter.js";
import { trainerRouter } from "./modules/trainers/interface/TrainerRouter.js";
import { admissionFormRouter } from "./modules/admission-forms/interface/AdmissionFormRouter.js";
import {
  swaggerSpec,
  swaggerUi,
} from "./shared/infrastructure/swagger/swaggerConfig.js";
import { createLegacyGateway } from "./shared/infrastructure/middleware/legacyGateway.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer() {
  const app = express();
  const healthService = new HealthCheckService();

  // ── Security ──
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for legacy React frontend compatibility
    }),
  );
  app.use(
    mongoSanitize({
      replaceWith: "_",
      onSanitize: ({ key }) => {
        logger.warn({ key }, "Sanitized MongoDB operator from input");
      },
    }),
  );

  // ── CORS ──
  const allowedOrigins = config.CORS_ORIGINS.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn({ origin }, "CORS blocked request");
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Tenant-Id",
        "X-Correlation-Id",
      ],
    }),
  );

  // ── Body Parsing ──
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ── Observability ──
  app.use(metricsMiddleware);
  app.use(correlationIdMiddleware);
  app.use(requestLoggerMiddleware);

  // ── Rate Limiting ──
  app.use(globalRateLimiter);

  // ── Health Checks (before tenant resolver — public routes) ──
  app.get("/health", (_req, res) => {
    res.json(healthService.liveness());
  });

  app.get("/ready", async (_req, res) => {
    const result = await healthService.readiness();
    res.status(result.status === "down" ? 503 : 200).json(result);
  });

  // ── Prometheus Metrics ──
  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  // ── Early Warning System ──
  const ews = new EarlyWarningSystem(config.EWS_WEBHOOK_URL);
  ews.addRule(memoryUsageRule());
  ews.addRule(eventLoopLagRule());
  ews.addRule(mongoConnectionRule());
  ews.start();

  app.get("/ews/alerts", (_req, res) => {
    res.json({
      success: true,
      data: {
        activeAlerts: ews.getActiveAlerts(),
        ruleCount: 3,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ── Tenant Resolution ──
  app.use("/api", tenantResolverMiddleware as any);

  // ── Legacy API Gateway (/api/* → /api/v1/*) ──
  app.use("/api", createLegacyGateway());

  // ── API Routes ──
  app.get("/api/v1/ping", (req, res) => {
    const appReq = req as AppRequest;
    res.json({
      success: true,
      data: {
        message: "pong",
        tenantId: appReq.tenantContext?.tenantId || null,
        correlationId: appReq.correlationId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ── Module Routers ──
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/tenants", tenantRouter);
  app.use("/api/v1/students", studentRouter);
  app.use("/api/v1/courses", courseRouter);
  app.use("/api/v1/fees", feeRouter);
  app.use("/api/v1/attendance", attendanceRouter);
  app.use("/api/v1/teachers", teacherRouter);

  // ── High Priority Modules ──
  app.use("/api/v1/batches", batchRouter);
  app.use("/api/v1/rbac", rbacRouter);
  app.use("/api/v1/marks", marksRouter);
  app.use("/api/v1/completions", completionRouter);
  app.use("/api/v1/installments", installmentRouter);
  app.use("/api/v1/receipts", receiptRouter);

  // ── Medium Priority Modules ──
  app.use("/api/v1/daybook", dayBookRouter);
  app.use("/api/v1/notes", noteRouter);
  app.use("/api/v1/issues", issueRouter);
  app.use("/api/v1/approvals", approvalRouter);
  app.use("/api/v1/payment-options", paymentOptionRouter);

  // ── Low Priority Modules ──
  app.use("/api/v1/custom-forms", customFormRouter);
  app.use("/api/v1/custom-fields", customFieldRouter);
  app.use("/api/v1/form-layout", formLayoutRouter);
  app.use("/api/v1/email-templates", emailTemplateRouter);
  app.use("/api/v1/labs", labRouter);
  app.use("/api/v1/timings", timingRouter);
  app.use("/api/v1/profile", profileRouter);
  app.use("/api/v1/commissions", commissionRouter);
  app.use("/api/v1/roll-numbers", rollNumberRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/subjects", subjectRouter);
  app.use("/api/v1/categories", categoryRouter);
  app.use("/api/v1/course-types", courseTypeRouter);
  app.use("/api/v1/number-of-years", numberOfYearsRouter);
  app.use("/api/v1/email-logs", emailLogRouter);
  app.use("/api/v1/payment-gateway", paymentGatewayRouter);
  app.use("/api/v1/batch-categories", batchCategoryRouter);
  app.use("/api/v1/trainers", trainerRouter);
  app.use("/api/v1/admission-forms", admissionFormRouter);

  // ── Swagger API Docs ──
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ── Static Uploads (with fallback to default avatar for missing images) ──
  const uploadsDir = path.join(process.cwd(), "uploads");
  const legacyImagesDir = path.join(process.cwd(), "images");
  const defaultAvatar = path.join(
    __dirname,
    "..",
    "frontend-build",
    "media",
    "avatars",
    "blank.png",
  );
  app.use("/uploads", express.static(uploadsDir));
  app.use("/uploads", (_req, res) => {
    res.sendFile(defaultAvatar);
  });

  app.get("/api/images/*", (req, res) => {
    const imgPath = (((req.params as any)[0] as string) || "").trim();
    if (
      !imgPath ||
      imgPath === "undefined" ||
      imgPath === "null" ||
      imgPath.endsWith("/")
    ) {
      res.sendFile(defaultAvatar);
      return;
    }
    const filename = path.basename(imgPath);
    const candidates = [
      path.join(uploadsDir, imgPath), // uploads/students/file.jpg
      path.join(uploadsDir, "students", filename), // uploads/students/file.jpg (flat)
      path.join(uploadsDir, filename), // uploads/file.jpg
      path.join(legacyImagesDir, filename), // images/file.jpg (legacy)
    ];
    const tryNext = (i: number): void => {
      if (i >= candidates.length) {
        res.sendFile(defaultAvatar);
        return;
      }
      res.sendFile(candidates[i], (err) => {
        if (err) tryNext(i + 1);
      });
    };
    tryNext(0);
  });

  // ── Static Frontend (SPA) ──
  const frontendBuildPath = path.join(__dirname, "..", "frontend-build");
  const publicPath = path.join(__dirname, "..", "public");
  app.use(express.static(frontendBuildPath, { etag: true, lastModified: true, maxAge: 0 }));
  app.use(express.static(publicPath, { etag: true, lastModified: true, maxAge: 0, extensions: ['html'] }));
  app.get("*", (_req, res, next) => {
    // Let API 404s fall through to error handler
    if (_req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendBuildPath, "index.html"), (err) => {
      if (err)
        res.sendFile(path.join(publicPath, "index.html"), (e) => {
          if (e) next();
        });
    });
  });

  // ── Error Handler (must be last) ──
  app.use(errorHandler as any);

  return app;
}
