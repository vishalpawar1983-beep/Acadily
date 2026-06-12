# 10 - Security Hardening

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## Priority: IMMEDIATE (Phase 0)

These fixes must be applied to the LEGACY system BEFORE any new development begins.

---

## SEC-01: Fix CORS (CRITICAL)

**Current**: `cors({ origin: "*" })` — any website can call the API.

**Fix**:
```typescript
// Per-tenant CORS whitelist
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getTenantAllowedOrigins(req.tenantId);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id', 'X-Correlation-Id'],
};
```

## SEC-02: Input Validation (CRITICAL)

**Current**: `req.body` passed directly to MongoDB. NoSQL injection possible.

**Fix**: Zod schemas on every endpoint.
```typescript
// Example: Create student
const createStudentSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  mobile_number: z.string().regex(/^\d{10}$/),
  courseName: z.string().regex(/^[a-f\d]{24}$/i),  // ObjectId format
  // ... all fields validated
});

// Middleware
const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.issues
    });
  }
  req.body = result.data;  // Use parsed (sanitized) data
  next();
};
```

## SEC-03: Secrets Management (CRITICAL)

**Current**: Plaintext `.env` files with payment keys, same JWT secret across apps.

**Fix**:
1. Generate unique JWT secrets per tenant (256-bit random)
2. Encrypt sensitive tenant config (Easebuzz keys, email passwords) at rest
3. Never log secrets (`pino.redact` configured)
4. Use environment variables, not `.env` in production
5. Rotate all existing secrets immediately

```bash
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## SEC-04: Stop Running as Root (CRITICAL)

**Current**: PM2 runs all processes as `root`.

**Fix**:
```bash
# Create application user
useradd -r -s /bin/false -m -d /var/www flexapp
chown -R flexapp:flexapp /var/www

# In Docker: already handled (USER appuser in Dockerfile)
# For legacy PM2 during migration:
su - flexapp -s /bin/bash -c "pm2 start ecosystem.config.js"
```

## SEC-05: Rate Limiting (HIGH)

**Current**: No rate limiting anywhere.

**Fix**:
```typescript
import rateLimit from 'express-rate-limit';

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 500,                    // 500 requests per window
  standardHeaders: true,
}));

// Strict limit on auth endpoints
app.use('/api/v1/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                     // 20 login attempts per 15 min
  message: { error: 'Too many attempts, try again later' }
}));

// Strict limit on OTP endpoints
app.use('/api/v1/auth/otp', rateLimit({
  windowMs: 60 * 1000,
  max: 3,                     // 3 OTP requests per minute
}));
```

## SEC-06: HTTP Security Headers (HIGH)

```typescript
import helmet from 'helmet';
app.use(helmet());
// Adds: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
// Strict-Transport-Security, Content-Security-Policy, etc.
```

## SEC-07: Fix Password Creation in GET (CRITICAL)

**Current**: `getAllStudentsController` creates user accounts inside a GET request.

**Fix**: Remove user creation from the GET handler entirely. User accounts should only be created:
1. During student enrollment (POST)
2. Via a dedicated admin endpoint (POST)
3. Via a one-time migration script

## SEC-08: Stop Logging Credentials (HIGH)

**Current**: `console.log('Using URI:', MONGO_URI)` prints DB password.

**Fix**: Remove immediately. Use Pino's redact feature for defense-in-depth.

## SEC-09: JWT Best Practices (HIGH)

**Current**: Long-lived tokens, no refresh mechanism (IMS), shared secret.

**Fix**:
```typescript
// Access token: short-lived (15 min)
const accessToken = jwt.sign(
  { userId, tenantId, role },
  ACCESS_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }
);

// Refresh token: longer-lived (7 days), stored in httpOnly cookie
const refreshToken = jwt.sign(
  { userId, tenantId },
  REFRESH_SECRET,
  { expiresIn: '7d', algorithm: 'HS256' }
);

// Refresh endpoint to get new access token
// Rotate refresh token on each use (refresh token rotation)
```

## SEC-10: MongoDB Query Injection Prevention (HIGH)

```typescript
// Sanitize query parameters to prevent operator injection
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn({ key, path: req.path }, 'Sanitized MongoDB operator from input');
  }
}));
```

## SEC-11: File Upload Security (MEDIUM)

**Current**: Multer with minimal validation, files stored locally.

**Fix**:
- Validate file type (magic bytes, not just extension)
- Limit file size (5MB for images)
- Scan for embedded scripts
- Store in Cloudinary (not local filesystem)
- Generate random filenames (never use user-provided names)

## Security Checklist (Apply to Legacy FIRST)

### Immediate (Day 1)
- [ ] Fix CORS to whitelist specific origins
- [ ] Remove `console.log` of MONGO_URI
- [ ] Add `helmet()` middleware
- [ ] Remove user creation from GET endpoint

### Week 1
- [ ] Add rate limiting on auth endpoints
- [ ] Add Zod validation on login/register endpoints
- [ ] Generate new JWT secrets (unique per app/tenant)
- [ ] Add `express-mongo-sanitize`
- [ ] Create non-root user for PM2

### Week 2
- [ ] Add Zod validation on all remaining endpoints
- [ ] Implement refresh token rotation
- [ ] Migrate local images to Cloudinary
- [ ] Set up file upload validation
- [ ] Audit all endpoints for authorization checks

## Security Testing

After hardening, verify with:
```bash
# Test CORS
curl -H "Origin: http://evil.com" -I http://66.116.207.89:3001/api/students

# Test rate limiting
for i in {1..25}; do curl -s -o /dev/null -w "%{http_code}\n" http://66.116.207.89:3001/api/login; done

# Test NoSQL injection
curl -X POST http://66.116.207.89:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":"test"}'

# Should return 400 (validation error), not 200
```
