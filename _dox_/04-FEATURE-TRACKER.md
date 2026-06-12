# 04 - Feature Tracker

> Version: 2.1 | Last Updated: 2026-03-07 | Status: ACTIVE

Legend:
- **Type**: `BE` = Backend, `UI` = UI/Frontend, `BOTH` = Both
- **Origin**: `LEGACY` = Existed in legacy IMS, `NEW` = Enhancement (not in legacy)
- **Status**: DONE / PENDING / SKIPPED

---

## 1. DONE - Ported & Working

### Core Modules (Phase 1)

| # | Feature | Module | Type | Origin | Notes |
|---|---------|--------|------|--------|-------|
| 1 | User Registration & Login (JWT) | `auth/` | BE | LEGACY | 25 unit tests, bcrypt, refresh tokens |
| 2 | Role-based Auth Guard (SuperAdmin/Admin/User) | `auth/` | BE | LEGACY | Middleware + role checks |
| 3 | Tenant (Company) Management | `tenant/` | BE | LEGACY | Was `company.models`. Multi-tenant with tenantId discriminator |
| 4 | Student Enrollment (Admission Form) | `student/` | BE | LEGACY | Was `addmission_form.models`. Enroll, update, dropout, list |
| 5 | Course + Subject Management | `course/` | BE | LEGACY | Was `courses.models` + `subject.models`. Subjects embedded in Course |
| 6 | Fee Payment Recording | `fees/` | BE | LEGACY | Was `courseFees.models`. Record payment, list, per-student fees |
| 7 | Attendance Marking | `attendance/` | BE | LEGACY | Was `attendence.model`. Mark, batch view, student view |
| 8 | Teacher Management | `teacher/` | BE | LEGACY | Was `teacher.model` + `trainer.models`. CRUD with auth guard |

### High Priority Legacy (Daily Use) -- ALL DONE

| # | Feature | Module | Type | Origin | Route | Notes |
|---|---------|--------|------|--------|-------|-------|
| 21 | Batch Management | `batch/` | BE | LEGACY | `/api/v1/batches` | Embedded students with subject progress tracking. 13 files |
| 22 | User Role Access (RBAC) | `rbac/` | BE | LEGACY | `/api/v1/rbac` | Flat permissions map (company/student/fees). By-role lookup. 12 files |
| 23 | Fee Receipt Counter | `receipt/` | BE | LEGACY | `/api/v1/receipts` | Atomic $inc for sequential receipt numbers (VM-2757). 10 files |
| 24 | Student Marks / Exam Results | `marks/` | BE | LEGACY | `/api/v1/marks` | Theory + practical per subject, result status tracking. 11 files |
| 25 | Course Completion / Graduation | `completion/` | BE | LEGACY | `/api/v1/completions` | Certificate number, status (completed/withdrawn/failed). 11 files |
| 26 | Fee Installment Plans | `installments/` | BE | LEGACY | `/api/v1/installments` | Due dates, overdue tracking, mark-paid, dropout flag. 12 files |

### Medium Priority Legacy (Weekly Use) -- ALL DONE

| # | Feature | Module | Type | Origin | Route | Notes |
|---|---------|--------|------|--------|-------|-------|
| 27 | Day Book (Accounting) | `daybook/` | BE | LEGACY | `/api/v1/daybook` | Dual entity: DayBookAccount + DayBookEntry. Double-entry support. 14 files |
| 28 | Student Notes & Reminders | `notes/` | BE | LEGACY | `/api/v1/notes` | Per-student notes with scheduled time. 12 files |
| 29 | Student Issues / Complaints | `issues/` | BE | LEGACY | `/api/v1/issues` | Status workflow (open/inProgress/resolved/closed), dashboard flag. 12 files |
| 30 | Approval Workflow | `approval/` | BE | LEGACY | `/api/v1/approvals` | Pending/approved/rejected with reviewer tracking. 12 files |
| 31 | Payment Options Config | `payment-options/` | BE | LEGACY | `/api/v1/payment-options` | Tenant-scoped payment methods (Cash, UPI, etc.). 11 files |

### Low Priority Legacy (Admin/Setup) -- ALL DONE

| # | Feature | Module | Type | Origin | Route | Notes |
|---|---------|--------|------|--------|-------|-------|
| 32 | Custom Forms Builder | `custom-forms/` | BE | LEGACY | `/api/v1/custom-forms` | Dual entity: FormDefinition + FormSubmission. Dynamic field types. 14 files |
| 33 | Email Templates | `email-templates/` | BE | LEGACY | `/api/v1/email-templates` | Template CRUD with HTML body + placeholders. 12 files |
| 35 | Lab Management | `lab/` | BE | LEGACY | `/api/v1/labs` | Simple CRUD, unique per tenant. 11 files |
| 36 | Timing / Schedule Slots | `timing/` | BE | LEGACY | `/api/v1/timings` | Start/end time slots, unique per tenant. 11 files |
| 37 | Profile Details | `profile/` | BE | LEGACY | `/api/v1/profile` | Extended user profile with comms preferences. Uses auth token userId. 9 files |
| 38 | Student Commission / Referral | `commission/` | BE | LEGACY | `/api/v1/commissions` | Auto-calc remaining. Full CRUD. 12 files |
| 40 | Roll Number Auto-Increment | `roll-number/` | BE | LEGACY | `/api/v1/roll-numbers` | Atomic $inc counter with optional prefix. 10 files |

### Platform Enhancements (New, Not in Legacy)

| # | Feature | Module | Type | Origin | Notes |
|---|---------|--------|------|--------|-------|
| 9 | Prometheus Metrics | `shared/metrics` | BE | NEW | HTTP histograms, auth counters, DB gauges, business metrics |
| 10 | Early Warning System (EWS) | `shared/ews` | BE | NEW | Memory, event loop lag, MongoDB connection rules |
| 11 | Swagger/OpenAPI Docs | `shared/swagger` | BE | NEW | Auto-generated at `/api-docs` |
| 12 | Structured Logging (Pino) | `shared/` | BE | NEW | JSON logs, correlation IDs, field redaction |
| 13 | Security Hardening | `shared/` | BE | NEW | Helmet, CORS whitelist, rate limiting, mongo-sanitize |
| 14 | Health + Readiness Checks | `server.ts` | BE | NEW | `/health`, `/ready` endpoints |
| 15 | Data Migration (3 DBs to 1) | `scripts/` | BE | NEW | 2,148 records migrated from VPS dumps to Atlas |
| 16 | Database Indexes | `scripts/` | BE | NEW | Compound tenant-scoped indexes on all collections |
| 17 | Docker + Prometheus Stack | `docker/` | BE | NEW | Dockerfile, docker-compose, Prometheus config |
| 18 | Render Pre-Prod Deployment | infra | BE | NEW | Auto-deploy on push to main, Atlas staging DB |
| 19 | Landing Page with Health Status | `public/` | UI | NEW | Static HTML with live health/EWS display |
| 20 | Tenant Isolation (Multi-tenancy) | `shared/` | BE | NEW | X-Tenant-Id header, token tenant mismatch prevention |

---

### Tenant Settings (Consolidated from 6 Legacy Singleton Models) -- DONE

| # | Feature | Module | Type | Origin | Route | Notes |
|---|---------|--------|------|--------|-------|-------|
| 34 | WhatsApp Toggle | `settings/` | BE | LEGACY | `/api/v1/settings` | Was `WhatsAppMessageSuggestion` singleton. Now `notifications.whatsappEnabled` |
| 39 | GST Percentage | `settings/` | BE | LEGACY | `/api/v1/settings` | Was `StudentGST_Guggestion` singleton. Now `fees.gstPercentage` |
| 76 | Email Toggle | `settings/` | BE | LEGACY | `/api/v1/settings` | Was `EmailSuggestion` singleton. Now `notifications.emailEnabled` |
| 77 | Welcome Email Toggle | `settings/` | BE | LEGACY | `/api/v1/settings` | Was `WelcomeEmail` singleton. Now `notifications.welcomeEmailEnabled` |
| 78 | Late Fees Toggle | `settings/` | BE | LEGACY | `/api/v1/settings` | Was `LateFees` singleton. Now `fees.lateFeesEnabled` |
| 79 | Reminder Text Templates | `settings/` | BE | LEGACY | `/api/v1/settings` | Was `EmailRemainder` singleton. Now `reminders.firstReminder/thirdReminder` |

## 2. PENDING - Legacy Features Not Yet Ported

NONE -- All legacy features have been ported.

### Skipped

| # | Feature | Type | Origin | Reason |
|---|---------|------|--------|--------|
| 41 | Salon Module | BOTH | LEGACY | Completely different domain. Separate app, separate frontend, separate models |

---

## 3. DEFERRED - New Enhancements (Not in Legacy)

### Security & Auth

| # | Feature | Type | Origin | Priority | Notes |
|---|---------|------|--------|----------|-------|
| 42 | Change Password Endpoint | BE | NEW | High | Users can't change their own password. No endpoint exists |
| 43 | Forgot Password / Reset Flow | BOTH | NEW | High | Email-based password reset with token |
| 44 | Account Lockout After N Failures | BE | NEW | Medium | Rate limiting exists but no per-account lockout |
| 45 | Rotate Secrets per Tenant | BE | NEW | Medium | JWT secrets currently shared across tenants |
| 46 | Audit Trail / Activity Log | BE | NEW | Medium | Who changed what and when. Legacy had none |

### API & Data

| # | Feature | Type | Origin | Priority | Notes |
|---|---------|------|--------|----------|-------|
| 47 | Search & Filter on List Endpoints | BE | NEW | High | Currently only pagination. Need search by name, date range, course, status |
| 48 | Delete / Archive Endpoints | BE | NEW | Medium | No DELETE on any module. Need soft-delete with `isArchived` flag |
| 49 | Bulk Operations | BE | NEW | Medium | Bulk-enroll students, bulk-record attendance, bulk-import via CSV |
| 50 | CSV / Excel Export | BE | NEW | Medium | Download reports — student list, fee collection, attendance |
| 51 | File Upload (Photos, Docs) | BOTH | NEW | Medium | Student photos, ID docs. Legacy stored on VPS local disk |
| 52 | Pagination Metadata | BE | NEW | Low | Add `totalPages`, `hasNext`, `hasPrev` to list responses |

### Observability & DevOps

| # | Feature | Type | Origin | Priority | Notes |
|---|---------|------|--------|----------|-------|
| 53 | Grafana Dashboards | BE | NEW | Medium | Prometheus metrics collected but no visualization |
| 54 | Loki Log Aggregation | BE | NEW | Low | Centralized log search. Deferred to VPS Docker setup |
| 55 | CI/CD Pipeline | BE | NEW | High | Automated test + lint on push. No pipeline exists today |
| 56 | Business EWS Rules | BE | NEW | Medium | Alert on fee collection drops, enrollment spikes |
| 57 | Security EWS Rules | BE | NEW | Medium | Alert on brute-force attempts, suspicious login patterns |
| 58 | Automated DB Backup | BE | NEW | High | Atlas M0 has no auto-backup |

### UI / Frontend Enhancements

| # | Feature | Type | Origin | Priority | Notes |
|---|---------|------|--------|----------|-------|
| 59 | Dashboard Analytics | UI | NEW | High | Enrollment trends, fee collection charts, attendance rates |
| 60 | Student Dashboard (Self-Service) | UI | NEW | Medium | Students view their own fees, attendance, marks |
| 61 | Mobile-Responsive UI | UI | NEW | Medium | Legacy UI was desktop-only |
| 62 | Dark Mode | UI | NEW | Low | Theme toggle |
| 63 | Notification Center (In-App) | BOTH | NEW | Medium | Bell icon with unread alerts, fee reminders |

### Infrastructure

| # | Feature | Type | Origin | Priority | Notes |
|---|---------|------|--------|----------|-------|
| 64 | Atlas Upgrade (M0 -> M10+) | BE | NEW | High | 512MB limit. Production will need paid tier |
| 65 | Render Paid Tier or VPS Migration | BE | NEW | High | Free tier has cold starts (30-50s) |
| 66 | DNS / Subdomain per Tenant | BE | NEW | Medium | `reliance.flexacademy.in` |
| 67 | Nginx Reverse Proxy Config | BE | NEW | Medium | For VPS production deployment |
| 68 | Blue-Green Deployment | BE | NEW | Low | Zero-downtime deploys |
| 69 | Image CDN (Cloudinary) | BE | NEW | Low | Migrate local VPS images to CDN |

---

## 4. Cleanup Tasks

| # | Task | Type | Priority | Notes |
|---|------|------|----------|-------|
| 70 | Remove temp debug scripts | BE | High | `check-user.ts`, `verify-password.ts`, `test-register.ts`, `test-login.ts`, `test-login-staging.ts` |
| 71 | Move Atlas URI out of scripts | BE | High | `create-admin-both-dbs.ts`, `promote-admin.ts` have connection strings in plaintext |
| 72 | Add Teacher module unit tests | BE | Medium | Only module without tests |
| 73 | Update Swagger for all new endpoints | BE | Medium | 18 new modules need API docs |
| 74 | Rotate VPS SSH password | BE | High | Credentials were exposed during migration session |
| 75 | Update migration roadmap doc | BE | Low | `03-MIGRATION-ROADMAP.md` needs Phase 1.7/1.8 marked done |

---

## Summary

| Category | Count |
|----------|-------|
| **DONE - Legacy Ported** | 33 features (8 core + 6 high + 5 medium + 7 low + 6 settings + 1 partial) |
| **DONE - New Platform** | 12 features |
| **PENDING - Legacy** | 0 features |
| **DEFERRED - Enhancements** | 28 features |
| **Cleanup Tasks** | 6 items |
| **Skipped** | 1 (Salon) |
| **Total Tracked** | **80 items** |

### Module File Count (302 total .ts files across 26 modules)

| Module | Files | Route |
|--------|-------|-------|
| auth | 16 | /api/v1/auth |
| tenant | 11 | /api/v1/tenants |
| student | 12 | /api/v1/students |
| course | 11 | /api/v1/courses |
| fees | 9 | /api/v1/fees |
| attendance | 10 | /api/v1/attendance |
| teacher | 11 | /api/v1/teachers |
| batch | 13 | /api/v1/batches |
| rbac | 12 | /api/v1/rbac |
| marks | 11 | /api/v1/marks |
| completion | 11 | /api/v1/completions |
| installments | 12 | /api/v1/installments |
| receipt | 10 | /api/v1/receipts |
| daybook | 14 | /api/v1/daybook |
| notes | 12 | /api/v1/notes |
| issues | 12 | /api/v1/issues |
| approval | 12 | /api/v1/approvals |
| payment-options | 11 | /api/v1/payment-options |
| custom-forms | 14 | /api/v1/custom-forms |
| email-templates | 12 | /api/v1/email-templates |
| lab | 11 | /api/v1/labs |
| timing | 11 | /api/v1/timings |
| profile | 9 | /api/v1/profile |
| commission | 12 | /api/v1/commissions |
| roll-number | 10 | /api/v1/roll-numbers |
| settings | 9 | /api/v1/settings |
