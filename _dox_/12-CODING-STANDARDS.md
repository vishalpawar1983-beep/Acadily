# 12 - Coding Standards & Conventions

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## Language & Runtime

- **TypeScript** (strict mode) for all new code
- **Node.js 22 LTS** as target runtime
- **ES Modules** (`"type": "module"` in package.json)

## File & Directory Naming

| Type | Convention | Example |
|------|-----------|---------|
| Directories | kebab-case | `custom-forms/`, `day-book/` |
| Source files | PascalCase for classes | `StudentRepository.ts` |
| Source files | camelCase for non-class | `createToken.ts` |
| Test files | Same as source + `.test` | `StudentRepository.test.ts` |
| Interfaces | Prefix with `I` | `IStudentRepository.ts` |
| Config files | kebab-case | `jest.config.ts` |

## Code Organization (Per Module)

```
modules/student/
├── domain/
│   ├── entities/
│   │   └── Student.ts          # Entity class (pure, no deps)
│   ├── value-objects/
│   │   ├── StudentId.ts
│   │   └── RollNumber.ts
│   ├── repositories/
│   │   └── IStudentRepository.ts  # Interface only
│   └── events/
│       └── StudentEnrolled.ts
├── application/
│   ├── EnrollStudent.ts         # Use case
│   ├── UpdateStudent.ts
│   └── GetStudents.ts
├── infrastructure/
│   └── MongoStudentRepository.ts  # Implements IStudentRepository
└── interface/
    ├── StudentRouter.ts          # Express routes
    ├── StudentController.ts      # HTTP → Use Case mapping
    └── schemas/
        └── studentSchemas.ts     # Zod validation schemas
```

## DDD Rules (ENFORCED)

1. **Domain layer has ZERO imports from infrastructure or interface layers**
2. **Entities are created via factory methods**, not raw constructors
3. **Value objects are immutable** — no setters
4. **Repositories return domain entities**, not Mongoose documents
5. **Use cases orchestrate**, they don't contain business rules
6. **One use case per file** — small, focused, testable

## Naming Conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Use Case | Verb + Noun | `EnrollStudent`, `ProcessPayment` |
| Repository | `I{Entity}Repository` / `Mongo{Entity}Repository` | `IStudentRepository` |
| Entity | Noun (singular) | `Student`, `Course`, `Payment` |
| Value Object | Descriptive noun | `Money`, `Email`, `DateRange` |
| Domain Event | Past tense | `StudentEnrolled`, `PaymentReceived` |
| Controller method | HTTP-aligned | `create`, `getById`, `list`, `update`, `remove` |
| Route path | Plural, kebab-case | `/students`, `/course-fees`, `/day-book` |

## Error Handling

```typescript
// Application-level errors (not HTTP errors)
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} with id ${id} not found`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message: string, public details?: any[]) {
    super('VALIDATION_ERROR', message, 400);
  }
}

// Global error handler (catches all)
app.use((err, req, res, next) => {
  const log = createRequestLogger(req);

  if (err instanceof AppError) {
    log.warn({ err, code: err.code }, err.message);
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details }
    });
  }

  // Unexpected error
  log.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
  });
});
```

## Testing Standards

### Test Structure
```typescript
describe('EnrollStudent', () => {
  describe('when student data is valid', () => {
    it('should create student and return id', async () => {
      // Arrange
      const repo = new InMemoryStudentRepository();
      const useCase = new EnrollStudent(repo);

      // Act
      const result = await useCase.execute({ name: 'John', email: 'john@test.com', ... });

      // Assert
      expect(result.id).toBeDefined();
      expect(repo.findById(result.id)).toBeDefined();
    });
  });

  describe('when email already exists', () => {
    it('should throw ConflictError', async () => { ... });
  });
});
```

### Coverage Targets
| Layer | Target |
|-------|--------|
| Domain (entities, VOs) | 90%+ |
| Application (use cases) | 80%+ |
| Infrastructure (repos) | 70%+ (integration tests) |
| Interface (controllers) | 60%+ (API tests) |
| Overall | 70%+ |

## Anti-Patterns (BANNED)

| Anti-Pattern | Why | Instead |
|-------------|-----|---------|
| Business logic in controllers | Untestable, fat controllers | Use application services |
| Direct Mongoose calls in controllers | Bypasses domain rules | Go through repositories |
| `any` type in TypeScript | Defeats type safety | Define proper types/interfaces |
| Nested callbacks | Unreadable | async/await |
| `console.log` | Unstructured, not grep-able | Use Pino logger |
| Hardcoded values | Not configurable | Use config module |
| `Model.find()` without tenantId | Data leak across tenants | Use TenantScopedRepository |
| Catching errors and ignoring them | Hides bugs | Log + rethrow or handle properly |
| `import *` | Unclear dependencies | Named imports |
| Mutable state in modules | Race conditions | Pure functions, immutable objects |

## Git Conventions

### Branch Naming
```
feature/{module}-{description}    # feature/student-enrollment-api
fix/{module}-{description}        # fix/fees-calculation-error
chore/{description}               # chore/upgrade-mongoose
docs/{description}                # docs/api-contracts
```

### Commit Messages
```
{type}({scope}): {description}

feat(student): add enrollment endpoint with validation
fix(fees): correct installment calculation for partial payments
refactor(auth): extract token service from controller
test(student): add unit tests for EnrollStudent use case
chore(deps): upgrade mongoose to 8.2.0
docs(api): add swagger annotations for student endpoints
```

## TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```
