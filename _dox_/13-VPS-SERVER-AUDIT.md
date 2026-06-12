# VPS Server Audit

**Date**: 2026-03-17
**Server**: 66.116.207.89 (66-116-207-89.webhostbox.net)

## Connection

```bash
ssh -o HostKeyAlgorithms=+ssh-rsa root@66.116.207.89
# Pass: zQ>iaRo
```

> **SECURITY**: SSH password needs rotation (was flagged in Feature Tracker #74)

## Server Specs

- **OS**: Ubuntu 22.04 (kernel 5.15.0-171)
- **CPU**: AMD EPYC 9J14 (4 vCPU, KVM)
- **RAM**: 3.8 GB
- **Disk**: 99 GB total, 22 GB used, 73 GB free
- **Swap**: 4 GB

## Running Apps (PM2)

| # | Name | Status | Port | Path |
|---|------|--------|------|------|
| 0 | ims-backend | **stopped** | 3002 | `/var/www/institute-management-system/SchoolsManagement-2-main/backend/` |
| 2 | chanakya1-backend | online | 4003 | `/var/www/Chanakya1/institute-management-system/SchoolsManagement-2-main/backend/` |
| 1 | saloon-backend | online | 5002 | `/var/www/Saloon-management-system-in-mern/Backend/` |
| 4 | vma-backend | online | 3001 | `/var/www/VMA/Dabims/backend/` |
| 3 | webliquidStudio-backend | online | 8001 | `/var/www/webliquidStudio/Dabims/backend/` |

## Nginx Sites

| Site | Frontend Root | API Proxy |
|------|--------------|-----------|
| ims | `.../demo1/build` | `127.0.0.1:3002` |
| chanakya1 | `.../demo1/build` | `127.0.0.1:4003` |
| saloon | `.../vite/dist` | `127.0.0.1:5002` |
| vma | `.../demo1/build` | `127.0.0.1:3001` |
| webliquidStudio | `.../demo1/build` | `127.0.0.1:8001` |

## Frontend Source Availability

### IMS & Chanakya (same codebase: `institute-management-system`)
- **Source**: YES — `demo1/src/` has full React/TypeScript source (app, config, _metronic)
- **Build**: YES — `demo1/build/`
- **Stack**: React + TypeScript (Metronic v8.2.0 template)
- **Git**: `github.com/Vishal-123-visual/institute-management-system.git`
- **Disk**: ~1.4 GB each (including node_modules)

### VMA & WebliquidStudio (same codebase: `Dabims`)
- **Source**: YES — `demo1/src/` has full React/TypeScript source (app, config, _metronic)
- **Build**: YES — `demo1/build/`
- **Stack**: React + TypeScript (Metronic v8.2.0 template)
- **Git**: `github.com/Dablu123kumar/Dabims.git`
- **Disk**: ~1.4 GB each (including node_modules)

### Saloon
- **Source**: YES — `vite/src/` has full React source (JSX, components, pages, hooks, i18n)
- **Build**: YES — `vite/dist/`
- **Stack**: React + Vite (JavaScript)
- **Git**: `github.com/Vishal-123-visual/Saloon-management-system-in-mern.git`
- **Disk**: 615 MB

## Summary

| App | Has Source? | Has Build? | Framework |
|-----|-----------|-----------|-----------|
| IMS (Reliance) | YES | YES | React/TS (Metronic) |
| Chanakya | YES | YES | React/TS (Metronic) |
| VMA | YES | YES | React/TS (Metronic) |
| WebliquidStudio | YES | YES | React/TS (Metronic) |
| Saloon | YES | YES | React/Vite (JSX) |

**All 5 apps have full frontend source code on the VPS, not just builds.**

## Local vs VPS Frontend Source Comparison

| App | VPS (source) | Local `_src_/` (legacy ref) | Local `frontend-build/` | Local `src/` (modern) |
|-----|-------------|---------------------------|------------------------|----------------------|
| IMS (Reliance) | `demo1/src/` | `_src_/ims/.../demo1/src/` | BUILD ONLY (minified JS/CSS) | Backend only |
| Chanakya | `demo1/src/` | `_src_/chanakya1/.../demo1/src/` | — | — |
| VMA | `demo1/src/` | **MISSING** (but same repo as Webliquid) | — | — |
| WebliquidStudio | `demo1/src/` | `_src_/webliquid-studio/Dabims/demo1/src/` | — | — |
| Saloon | `vite/src/` | `_src_/saloon/vite/src/` | — | — |

### Key Findings

1. **`frontend-build/`** = compiled React build output only (chunked JS/CSS, no source). This is the IMS build served by Express in staging.
2. **`_src_/`** = has frontend source for all apps as legacy reference (IMS, Chanakya, Webliquid/Dabims, Saloon). No `node_modules` installed.
3. **`src/`** = modern backend only (DDD modules). **No frontend source in the modernized codebase.**
4. **VMA** is not explicitly in `_src_/`, but VMA and WebliquidStudio are identical (same git repo `github.com/Dablu123kumar/Dabims.git`, same commit `8fddecb`).

### Git Remotes (VPS)

| App | Remote |
|-----|--------|
| IMS | `github.com/Vishal-123-visual/institute-management-system.git` |
| Chanakya | same as IMS |
| VMA | `github.com/Dablu123kumar/Dabims.git` |
| WebliquidStudio | same as VMA |
| Saloon | `github.com/Vishal-123-visual/Saloon-management-system-in-mern.git` |

## No DOCX Files

No `.docx` files found anywhere on the server.

## Disk Usage

```
1.4G  /var/www/institute-management-system/
1.5G  /var/www/Chanakya1/
1.4G  /var/www/VMA/
1.4G  /var/www/webliquidStudio/
615M  /var/www/Saloon-management-system-in-mern/
────
6.1G  /var/www/ (total)
```
