# 05 - Multi-Tenancy Specification

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## Strategy: Shared Database, Shared Schema, Tenant Discriminator

See ADR-002 for decision rationale.

Every document in MongoDB gets a `tenantId` field. Every query is scoped by `tenantId`. No exceptions.

### Database per Environment (all Atlas M0 free tier for dev/staging)

| Environment | Database Name | Host |
|-------------|--------------|------|
| Development | `flex_academy_dev` | Atlas M0 (free) |
| Staging | `flex_academy_staging` | Atlas M0 (free) |
| Production | `flex_academy` | Local MongoDB on VPS |

> Current total data across all 4 legacy DBs: **~14 MB**. Atlas M0 limit: 512 MB.
> Both dev + staging combined will use <60 MB — 88% headroom remaining.

### Salon Tenancy Note
> The Salon bounded context is a **completely independent product** from Institute Management.
> Zero code overlap. It shares only the Shared Kernel (Auth, Tenant, Logging) and the
> `tenantId` discrimination pattern. Salon tenants use `type: "salon"` in their tenant
> config, which activates salon-specific routes and disables institute-specific features.

## Tenant Resolution Flow

```
Request arrives
    │
    ▼
[Nginx] ──────────────────────────────────────┐
    │                                          │
    ▼                                          │
[Tenant Resolver Middleware]                   │
    │                                          │
    ├── Option A: Subdomain                    │
    │   chanakya.flexacademy.in → tenantId     │
    │                                          │
    ├── Option B: Header                       │
    │   X-Tenant-Id: tenant_chanakya           │
    │                                          │
    ├── Option C: JWT Claim                    │
    │   token.tenantId → tenantId              │
    │                                          │
    ▼                                          │
[Attach to RequestContext]                     │
    │                                          │
    ▼                                          │
[All downstream queries auto-scoped]          │
```

### Resolution Priority
1. JWT claim `tenantId` (authenticated requests)
2. `X-Tenant-Id` header (API integrations)
3. Subdomain extraction (browser requests)
4. Reject if no tenant resolved (except public routes: login, health)

## Tenant Data Model

```typescript
// Tenant Entity
interface Tenant {
  _id: ObjectId;
  tenantId: string;          // e.g., "ims_reliance", "chanakya", "webliquid", "salon_main"
  name: string;              // Display name
  type: "institute" | "salon";
  slug: string;              // URL-safe identifier
  domain: string;            // Custom domain or subdomain
  config: TenantConfig;
  status: "active" | "suspended" | "trial";
  createdAt: Date;
  updatedAt: Date;
}

// Tenant-specific configuration
interface TenantConfig {
  branding: {
    logoUrl: string;
    primaryColor: string;
    appName: string;
  };
  features: {
    easebuzzEnabled: boolean;
    whatsappEnabled: boolean;
    gstEnabled: boolean;
    customFormsEnabled: boolean;
    attendanceEnabled: boolean;
  };
  payment: {
    gateway: "easebuzz" | "none";
    easebuzzKey?: string;      // encrypted
    easebuzzSalt?: string;     // encrypted
    easebuzzEnv: "test" | "prod";
  };
  email: {
    senderEmail: string;
    senderPassword: string;    // encrypted
    senderName: string;
  };
  limits: {
    maxStudents: number;       // -1 for unlimited
    maxUsers: number;
    maxStorageMB: number;
  };
}
```

## Tenant-Scoped Repository Pattern

```typescript
// Base repository that ALL module repositories extend
abstract class TenantScopedRepository<T> {
  constructor(
    protected model: Model<T>,
    protected tenantContext: TenantContext
  ) {}

  // EVERY query is automatically scoped
  protected scopedQuery(filter: FilterQuery<T> = {}): FilterQuery<T> {
    return {
      ...filter,
      tenantId: this.tenantContext.tenantId  // NEVER forget this
    };
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(this.scopedQuery(filter));
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findOne(this.scopedQuery({ _id: id }));
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create({
      ...data,
      tenantId: this.tenantContext.tenantId  // Auto-inject
    });
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    return this.model.findOneAndUpdate(
      this.scopedQuery({ _id: id }),
      data,
      { new: true }
    );
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.deleteOne(this.scopedQuery({ _id: id }));
    return result.deletedCount > 0;
  }
}
```

## Data Isolation Safeguards

### Layer 1: Middleware
```typescript
// Tenant resolver middleware - runs on EVERY request
const tenantResolver = async (req, res, next) => {
  const tenantId = extractTenantId(req);
  if (!tenantId && !isPublicRoute(req.path)) {
    return res.status(400).json({ error: "Tenant not identified" });
  }
  req.tenantContext = { tenantId };
  next();
};
```

### Layer 2: Repository
All repositories extend `TenantScopedRepository`. Direct `Model.find()` calls are BANNED.

### Layer 3: Mongoose Plugin (Defense in Depth)
```typescript
// Mongoose plugin that auto-adds tenantId to all queries
function tenantPlugin(schema: Schema) {
  schema.add({ tenantId: { type: String, required: true, index: true } });

  // Auto-scope all find operations
  schema.pre(/^find/, function() {
    if (!this.getQuery().tenantId) {
      throw new Error("TENANT_SCOPE_VIOLATION: Query without tenantId");
    }
  });
}
```

### Layer 4: Testing
- Integration tests verify cross-tenant data isolation
- Test: Create data for Tenant A, query as Tenant B, expect empty result

## Existing Tenant Mapping

| Legacy App | Tenant ID | Tenant Name | Type | Database Source |
|-----------|-----------|-------------|------|---------------|
| IMS (Reliance) | `ims_reliance` | Reliance Institute | institute | `SchoolsStore` |
| Chanakya1 | `chanakya` | Chanakya's Prep | institute | `Chanakya` |
| WebliquidStudio | `webliquid` | WebliquidStudio (Dabims) | institute | `webliquidStudio` |
| Saloon | `salon_main` | Salon Management | salon | `Saloon` |

## Migration: 3 DBs -> 1 DB

```
Step 1: Create tenants collection with above mapping
Step 2: For each legacy database:
  - Read all collections
  - Add tenantId field to every document
  - Write to unified database
  - Verify document counts match
Step 3: Update all ObjectId references (they stay the same within a tenant)
Step 4: Create compound indexes: { tenantId: 1, <existing_index_fields> }
Step 5: Verify with read queries per tenant
Step 6: Point new app to unified DB
Step 7: Keep legacy DBs as backup for 30 days
```

## Index Strategy

Every collection needs at minimum:
```
{ tenantId: 1 }                          // Base tenant filter
{ tenantId: 1, createdAt: -1 }           // Tenant + time sort
{ tenantId: 1, <primary_lookup_field> }  // Tenant + business key
```

Examples:
```
students:    { tenantId: 1, email: 1 }     (unique within tenant)
courses:     { tenantId: 1, name: 1 }
batches:     { tenantId: 1, courseId: 1 }
payments:    { tenantId: 1, studentId: 1, createdAt: -1 }
attendance:  { tenantId: 1, batchId: 1, date: 1 }
```

## Tenant Onboarding Checklist

To add a new tenant (target: <30 minutes):
1. [ ] Run `seed-tenant.ts` with tenant config
2. [ ] Set up email credentials (encrypted in tenant config)
3. [ ] Configure payment gateway keys (if applicable)
4. [ ] Upload branding assets (logo, colors)
5. [ ] Create admin user for the tenant
6. [ ] Configure DNS/subdomain
7. [ ] Verify login and basic operations
