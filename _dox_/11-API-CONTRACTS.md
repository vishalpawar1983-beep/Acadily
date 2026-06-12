# 11 - API Contracts & Conventions

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## API Versioning

All endpoints are versioned: `/api/v1/...`

Legacy endpoints (`/api/students`) will be proxied to `/api/v1/students` during migration via Nginx rewrite, then deprecated.

## URL Convention

```
/api/v1/{module}/{resource}
/api/v1/{module}/{resource}/:id
/api/v1/{module}/{resource}/:id/{sub-resource}
```

Examples:
```
GET    /api/v1/institute/students              # List students
POST   /api/v1/institute/students              # Create student
GET    /api/v1/institute/students/:id           # Get student
PUT    /api/v1/institute/students/:id           # Update student
DELETE /api/v1/institute/students/:id           # Delete student
GET    /api/v1/institute/students/:id/fees      # Get student fees
POST   /api/v1/institute/students/:id/notes     # Add student note

GET    /api/v1/institute/courses
GET    /api/v1/institute/batches
GET    /api/v1/institute/attendance

GET    /api/v1/finance/payments
GET    /api/v1/finance/day-book
POST   /api/v1/finance/receipts/:id/approve

GET    /api/v1/salon/services
GET    /api/v1/salon/customers
POST   /api/v1/salon/cart

POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /health
GET    /ready
GET    /metrics
```

## Request/Response Format

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate resource |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Dependency down |

## Pagination

All list endpoints support pagination:

```
GET /api/v1/institute/students?page=1&limit=20&sort=-createdAt
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| page | 1 | - | Page number |
| limit | 20 | 100 | Items per page |
| sort | -createdAt | - | Sort field (- prefix = descending) |

## Filtering

Query parameters for filtering:
```
GET /api/v1/institute/students?status=active&courseName=BCA&search=john
```

## Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes* | `Bearer <access_token>` |
| Content-Type | Yes (POST/PUT) | `application/json` |
| X-Tenant-Id | Optional | Tenant identifier (fallback to JWT) |
| X-Correlation-Id | Optional | Request tracing ID (auto-generated if absent) |

*Not required for: `/health`, `/ready`, `/api/v1/auth/login`

## Authentication Flow

```
1. POST /api/v1/auth/login
   Body: { email, password }
   Response: { accessToken, refreshToken (httpOnly cookie) }

2. All subsequent requests:
   Header: Authorization: Bearer <accessToken>

3. When accessToken expires (15min):
   POST /api/v1/auth/refresh
   Cookie: refreshToken (sent automatically)
   Response: { accessToken (new), refreshToken (rotated, httpOnly cookie) }

4. POST /api/v1/auth/logout
   Invalidates refresh token
```

## Role-Based Access

| Role | Institute Endpoints | Salon Endpoints | Admin Endpoints |
|------|-------------------|-----------------|-----------------|
| SuperAdmin | Full access | Full access | Full access |
| Admin | Full access (own tenant) | Full access (own tenant) | Read only |
| Counsellor | Students, Courses, Fees | - | - |
| Accounts | Fees, Day Book, Receipts | - | - |
| Telecaller | Students (read), Enquiry | - | - |
| Teacher | Attendance, Subjects, Batches | - | - |
| Student | Own profile, Own fees | - | - |
| Staff | - | Services, Customers, Cart, Payments | - |

## API Documentation

Swagger/OpenAPI spec auto-generated from Zod schemas using `zod-to-openapi`.
Available at: `GET /api/v1/docs` (staging only, disabled in production)
