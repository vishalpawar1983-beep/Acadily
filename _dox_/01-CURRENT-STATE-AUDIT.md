# 01 - Current State Audit

> Version: 1.1 | Last Updated: 2026-03-17 | Status: ACTIVE

## Server Infrastructure

| Property | Value |
|----------|-------|
| IP | 66.116.207.89 |
| OS | Ubuntu 22.04 (kernel 5.15.0-97) |
| CPU | AMD EPYC 9J14, KVM virtualized |
| RAM | 3.8 GB |
| Disk | 99 GB (22% used, 75 GB free) |
| Swap | 4 GB (swapfile1) |
| Node.js | v24.13.1 |
| NPM | 11.8.0 |
| MongoDB | 7.x (auth enabled, local only) |
| Web Server | Nginx (reverse proxy + static) |
| Process Manager | PM2 |
| Docker | NOT installed (CAN be installed - KVM, cgroups v2, overlay FS supported) |
| CI/CD | NONE |
| Git | Repos exist on server, no remote push workflow |

## Applications Inventory

### App 1: IMS (Institute Management System) - PRIMARY
- **Path**: `/var/www/institute-management-system/SchoolsManagement-2-main/`
- **Frontend**: React + TypeScript (Metronic template), port 3000
- **Backend**: Express.js (ES modules), port 3001
- **Database**: MongoDB `SchoolsStore` (user: `imsapp`)
- **Backend LOC**: ~14,000 lines JS
- **Frontend LOC**: ~74,500 lines TSX/TS
- **Models**: 30+ Mongoose schemas
- **Controllers**: 25+ files
- **Routes**: 25+ files
- **Features**: Students, Courses, Batches, Fees, Attendance, Day Book, Email Reminders, Custom Forms, Subject Marks, Teachers, User Roles, Approval Workflow
- **Payment**: Easebuzz (PROD keys)
- **Email**: Nodemailer via Gmail (`visualmediatechnology@gmail.com`)

### App 2: Chanakya1 - CLONE OF IMS
- **Path**: `/var/www/Chanakya1/institute-management-system/SchoolsManagement-2-main/`
- **Exact copy** of IMS codebase with different `.env`
- **Database**: MongoDB `Chanakya` (user: `chanakyaapp`)
- **Frontend port**: 4002, **Backend port**: 4003
- **Payment**: Easebuzz (TEST keys)
- **Email**: `chanakyasprep@gmail.com`

### App 3: VMA (Dabims) - CLONE OF IMS
- **Path**: `/var/www/VMA/Dabims/`
- **Exact copy** of Dabims codebase with different `.env`
- **Database**: MongoDB via Dabims
- **Backend port**: 3001
- **Git**: `github.com/Dablu123kumar/Dabims.git`

### App 4: WebliquidStudio (Dabims) - CLONE OF IMS
- **Path**: `/var/www/webliquidStudio/Dabims/`
- **Exact copy** of Dabims codebase with different `.env`
- **Database**: MongoDB `webliquidStudio` (user: `webliquidStudio`, authSource: admin)
- **Backend port**: 8001
- **Git**: `github.com/Dablu123kumar/Dabims.git` (same repo as VMA)
- **Payment**: Easebuzz (TEST keys)
- **Email**: `webliquidstudio@gmail.com`

### App 5: Saloon Management System - COMPLETELY INDEPENDENT APP
- **Path**: `/var/www/Saloon-management-system-in-mern/`
- **Frontend**: Vite + React (TailwindCSS), port 5000
- **Backend**: Express.js v5.1 (ES modules), port 5002
- **Database**: MongoDB `Saloon` (user: `saloonapp`)
- **Backend LOC**: ~2,500 lines JS
- **Models**: 8 Mongoose schemas
- **Features**: Categories, Services, Customers, Cart, Payments, Saved Carts, Appointments
- **Image storage**: Cloudinary (unlike IMS which uses local disk)
- **Auth**: JWT + refresh tokens + OTP (different from IMS which has no refresh tokens)

> **IMPORTANT: Salon is NOT a clone of IMS.** Zero code overlap. Entirely different domain
> (retail/service vs education), different models, different frontend stack (Vite+Tailwind vs
> Metronic template), different Express version (v5 vs v4), different auth flow, different
> user roles (admin/staff/customer vs SuperAdmin/Admin/Counsellor/Accounts/Telecaller/Student).
> The ONLY shared trait is both being Express+Mongoose apps on the same server.
> In the target architecture, Salon lives as its own **bounded context** sharing only the
> Shared Kernel (Auth, Tenant, Logging) with the Institute modules.

## Database Inventory (Measured 2026-03-07)

| Database | Auth User | Collections | Objects | Data Size | Total Size |
|----------|-----------|-------------|---------|-----------|-----------|
| SchoolsStore | imsapp | 45 | 3,323 | 5.7 MB | 4.4 MB |
| Chanakya | chanakyaapp | 45 | 4,069 | 24.2 MB | 7.0 MB |
| webliquidStudio | webliquidStudio | 45 | 66 | 53 KB | 1.8 MB |
| Saloon | saloonapp | 7 | 63 | 17 KB | 312 KB |
| **TOTAL** | | **142** | **7,521** | **~30 MB** | **~13.5 MB** |

> **Atlas M0 free tier (512 MB) has 97% headroom.** Current total data is ~14 MB.
> Even 10x growth stays well under the limit. See ADR-004.

## Architecture Pattern (Current)

```
                    Internet
                       |
                    [Nginx]
                   /   |    |    \    \
             :3002  :4003 :3001 :5002  :8001   (Express API via /api/ proxy)
                |      |    |     |      |
              [Nginx serves demo1/build or vite/dist as static frontend]
                |      |    |     |      |
              [MongoDB 127.0.0.1:27017]
              SchoolsStore | Chanakya | VMA | Saloon | webliquidStudio
```

## Code Quality Assessment

### Severity: CRITICAL
| Finding | Details |
|---------|---------|
| CORS wide open | `cors({ origin: "*" })` on IMS - any website can call API |
| No input validation | `req.body` passed directly to MongoDB queries |
| Secrets in plaintext | `.env` files with payment keys, JWT secrets on disk |
| Same JWT secret | `asbdfasdfbsdfabsjdfasdfjba` shared across 3 apps |
| DB URI logged | `console.log('Using URI:', MONGO_URI)` prints credentials |
| Running as root | All PM2 processes run as root user |
| Password creation in GET | `getAllStudentsController` creates user accounts inside a list endpoint |
| No rate limiting | Login/OTP endpoints unprotected |
| Images on local disk | `/backend/images/` - no backup, no CDN |

### Severity: HIGH
| Finding | Details |
|---------|---------|
| Zero tests | No test files found anywhere |
| Zero CI/CD | No pipeline, manual deployment |
| Copy-paste deployment | 3 identical codebases, bug fix = 3 patches |
| No logging strategy | Only `console.log` |
| No health checks | No way to verify system health |
| nodemon in production | Start scripts use nodemon |
| No error handling strategy | Inconsistent try/catch patterns |
| Fat controllers | Business logic in route handlers |

### Severity: MEDIUM
| Finding | Details |
|---------|---------|
| No API versioning | Paths like `/api/students` with no version |
| No pagination defaults | Some endpoints return all records |
| Mixed naming conventions | `addmission_form`, `batchCategory`, `courseFees` |
| Typos in code | `attendence`, `remainder` (should be reminder), `comission` |
| Commented-out code | Dead code left in production |

## Dependencies (IMS Backend)

```json
{
  "axios": "^1.7.9",
  "bcryptjs": "^2.4.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "moment": "^2.30.1",
  "mongoose": "^8.1.3",
  "multer": "^1.4.5-lts.1",
  "node-cron": "^3.0.3",
  "nodemailer": "^6.9.13",
  "nodemon": "^3.0.3"
}
```

## Dependencies (Saloon Backend)

```json
{
  "bcrypt": "^6.0.0",
  "cloudinary": "^1.41.3",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5",
  "dotenv": "^17.2.1",
  "express": "^5.1.0",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.17.2",
  "multer": "^2.0.2",
  "multer-storage-cloudinary": "^4.0.0",
  "nodemailer": "^7.0.13"
}
```

## Key Observations

1. **IMS is the core product** - Chanakya1, VMA, and WebliquidStudio are just copies. Multi-tenancy eliminates them.
2. **VMA and WebliquidStudio share the Dabims repo** - Same GitHub remote (`github.com/Dablu123kumar/Dabims.git`), same commit history. Deployed twice with different configs.
3. **Salon is a completely independent product** - Zero code overlap with IMS. Different domain (retail vs education), different models (8 vs 30+), different frontend (Vite+Tailwind vs Metronic), different Express version (v5 vs v4), different auth (refresh tokens + OTP vs basic JWT), different user roles, different image storage (Cloudinary vs local). Lives as its own bounded context in the target architecture, sharing only Shared Kernel.
4. **Frontend is heavy but functional** - 74K LOC is mostly the Metronic admin template. Custom business pages are a smaller subset.
5. **All 5 apps have full frontend source on VPS** - Not just builds. Source recovered locally to `_src_/ims-frontend-source/`. See `13-VPS-SERVER-AUDIT.md`.
6. **No data migration complexity** - All IMS databases have the same schema. Migration to unified DB is straightforward.
7. **Server can handle Docker** - KVM virtualization with cgroups v2 and overlay FS support.
