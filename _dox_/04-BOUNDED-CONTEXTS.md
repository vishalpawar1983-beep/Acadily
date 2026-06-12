# 04 - Bounded Contexts & Domain Model

> Version: 1.0 | Last Updated: 2026-03-07 | Status: ACTIVE

## Context Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHARED KERNEL                            │
│  Auth/IAM, Tenant Resolution, Logging, Event Bus, Config       │
└────────┬───────────────┬──────────────┬───────────┬─────────────┘
         │               │              │           │
   ┌─────┴─────┐  ┌──────┴─────┐ ┌─────┴────┐ ┌───┴──────────┐
   │ INSTITUTE  │  │   SALON    │ │ FINANCE  │ │COMMUNICATION │
   │ MANAGEMENT │  │ MANAGEMENT │ │          │ │              │
   │            │  │            │ │          │ │              │
   │ Student    │  │ Service    │ │ Fees     │ │ Email        │
   │ Course     │  │ Customer   │ │ Payment  │ │ WhatsApp     │
   │ Batch      │  │ Cart       │ │ Day Book │ │ Templates    │
   │ Attendance │  │ Category   │ │ Receipt  │ │ Reminders    │
   │ Subject    │  │ Appointment│ │ Installmt│ │              │
   │ Teacher    │  │            │ │          │ │              │
   │ Custom Form│  │            │ │          │ │              │
   └────────────┘  └────────────┘ └──────────┘ └──────────────┘
         │                              │
   ┌─────┴─────┐                 ┌──────┴─────┐
   │ APPROVAL  │                 │  REPORTING  │
   │           │                 │             │
   │ Workflows │                 │ Dashboard   │
   │ Role Accss│                 │ Health      │
   │           │                 │ Metrics     │
   └───────────┘                 └─────────────┘
```

## Salon vs Institute: Complete Separation

> **The Salon bounded context is a fully independent product** that shares ZERO domain logic
> with Institute Management. Different entities, different workflows, different user roles,
> different payment models. In the current codebase they are entirely separate apps with no
> code overlap. In the target architecture they remain fully independent bounded contexts,
> connected only through the Shared Kernel (Auth, Tenant, Logging).

| Aspect | Institute | Salon |
|--------|-----------|-------|
| Domain | Education (Students, Courses, Fees, Attendance) | Retail/Service (Services, Customers, Cart) |
| Models | 30+ schemas | 8 schemas |
| User roles | SuperAdmin, Admin, Counsellor, Accounts, Telecaller, Student | admin, staff, customer |
| Payments | Easebuzz gateway, installment-based | Cash/card/online, POS cart checkout |
| Images | Local filesystem (multer) | Cloudinary |
| Frontend | React+TS (Metronic template) | Vite+React (TailwindCSS) |
| Express | v4.18 | v5.1 |
| Cross-dependency | None with Salon | None with Institute |

## Relationships Between Contexts

| Upstream | Downstream | Relationship |
|----------|-----------|-------------|
| Auth/IAM | All modules | Shared Kernel (User, Role, Token) |
| Tenant | All modules | Shared Kernel (TenantContext) |
| Student | Fees | Customer-Supplier (Student enrolls -> Fees generated) |
| Student | Attendance | Customer-Supplier (Student exists -> can mark attendance) |
| Course | Student | Customer-Supplier (Course exists -> Student enrolls in it) |
| Fees | Day Book | Publisher-Subscriber (Payment made -> Day Book entry) |
| Fees | Communication | Publisher-Subscriber (Payment due -> Reminder sent) |
| Approval | Fees | Customer-Supplier (Receipt needs approval) |
| Salon | NONE from Institute | Fully independent — shares only Shared Kernel |
| Institute | NONE from Salon | Fully independent — shares only Shared Kernel |

---

## Bounded Context: SHARED KERNEL

### Entities
- **User** - Authenticated user across all modules
- **Tenant** - Organization/institute/salon

### Value Objects
- `TenantId`, `UserId`, `Email`, `PhoneNumber`, `Money`, `DateRange`

### Services
- `AuthService` - JWT token generation/validation
- `TenantResolver` - Resolve tenant from request context
- `Logger` - Structured logging with tenant/user context

---

## Bounded Context: INSTITUTE MANAGEMENT

### Aggregate: Student
```
Student (Aggregate Root)
├── studentId: StudentId
├── tenantId: TenantId
├── personalInfo: PersonalInfo (VO)
│   ├── name: string
│   ├── email: Email (VO)
│   ├── phone: PhoneNumber (VO)
│   ├── address: Address (VO)
│   ├── dateOfBirth: Date
│   └── photo: ImageUrl
├── academicInfo: AcademicInfo (VO)
│   ├── rollNumber: RollNumber (VO)
│   ├── enrollmentDate: Date
│   └── status: StudentStatus (Active|Completed|DroppedOut)
├── courseEnrollments: CourseEnrollment[]
│   ├── courseId: CourseId
│   ├── batchId: BatchId
│   ├── enrolledAt: Date
│   └── completedAt: Date?
├── feeProfile: reference -> Fees context
└── notes: StudentNote[]

Domain Events:
  - StudentEnrolled
  - StudentDroppedOut
  - StudentCourseCompleted
```

### Aggregate: Course
```
Course (Aggregate Root)
├── courseId: CourseId
├── tenantId: TenantId
├── name: string
├── category: CourseCategory
├── courseType: CourseType
├── duration: CourseDuration (VO)
│   ├── numberOfYears: number
│   └── unit: DurationUnit
├── subjects: Subject[]
│   ├── subjectId: SubjectId
│   ├── name: string
│   └── maxMarks: number
├── fees: CourseFeeStructure (VO)
│   ├── totalFees: Money (VO)
│   ├── installmentCount: number
│   └── installmentSchedule: InstallmentSchedule[]
└── status: Active|Archived

Domain Events:
  - CourseCreated
  - CourseFeeUpdated
```

### Aggregate: Batch
```
Batch (Aggregate Root)
├── batchId: BatchId
├── tenantId: TenantId
├── name: string
├── category: BatchCategory
├── courseId: CourseId
├── trainerId: TrainerId
├── timing: BatchTiming (VO)
│   ├── startTime: Time
│   ├── endTime: Time
│   └── days: DayOfWeek[]
├── lab: Lab?
├── students: StudentId[]
├── capacity: number
└── status: Active|Completed

Domain Events:
  - BatchCreated
  - StudentAddedToBatch
```

### Aggregate: Attendance
```
AttendanceRecord (Aggregate Root)
├── recordId: AttendanceId
├── tenantId: TenantId
├── batchId: BatchId
├── date: Date
├── entries: AttendanceEntry[]
│   ├── studentId: StudentId
│   ├── status: Present|Absent|Late
│   └── markedBy: UserId
└── markedAt: Date
```

### Entity: Teacher
```
Teacher
├── teacherId: TeacherId
├── tenantId: TenantId
├── personalInfo: PersonalInfo (VO)
├── subjects: SubjectId[]
├── batches: BatchId[]
└── status: Active|Inactive
```

---

## Bounded Context: FINANCE

### Aggregate: StudentFees
```
StudentFees (Aggregate Root)
├── feesId: FeesId
├── tenantId: TenantId
├── studentId: StudentId
├── courseId: CourseId
├── totalAmount: Money
├── paidAmount: Money
├── pendingAmount: Money (calculated)
├── installments: Installment[]
│   ├── installmentNumber: number
│   ├── amount: Money
│   ├── dueDate: Date
│   ├── paidDate: Date?
│   ├── status: Pending|Paid|Overdue
│   └── paymentMethod: PaymentMethod
├── receipts: Receipt[]
│   ├── receiptId: ReceiptId
│   ├── amount: Money
│   ├── date: Date
│   ├── approvalStatus: Pending|Approved|Rejected
│   └── approvedBy: UserId?
├── lateFeeApplied: Money
└── gstDetails: GSTInfo? (VO)

Domain Events:
  - PaymentReceived
  - InstallmentOverdue
  - ReceiptGenerated
  - LateFeeApplied
```

### Aggregate: DayBook
```
DayBookEntry (Aggregate Root)
├── entryId: EntryId
├── tenantId: TenantId
├── account: DayBookAccount
├── type: Income|Expense
├── amount: Money
├── description: string
├── referenceId: string? (links to payment/receipt)
├── date: Date
└── createdBy: UserId
```

---

## Bounded Context: SALON MANAGEMENT

### Aggregate: Service
```
SalonService (Aggregate Root)
├── serviceId: ServiceId
├── tenantId: TenantId
├── name: string
├── category: CategoryId
├── price: Money
├── duration: Minutes
├── image: ImageUrl?
└── status: Active|Inactive
```

### Aggregate: Customer
```
SalonCustomer (Aggregate Root)
├── customerId: CustomerId
├── tenantId: TenantId
├── name: string
├── phone: PhoneNumber
├── email: Email?
├── visitHistory: Visit[]
│   ├── visitDate: Date
│   ├── services: ServiceId[]
│   └── paymentId: PaymentId
└── totalSpent: Money (calculated)
```

### Aggregate: Cart / SavedCart
```
Cart (Aggregate Root)
├── cartId: CartId
├── tenantId: TenantId
├── customerId: CustomerId?
├── items: CartItem[]
│   ├── serviceId: ServiceId
│   ├── quantity: number
│   └── price: Money
├── total: Money (calculated)
└── status: Active|Saved|Completed
```

---

## Bounded Context: COMMUNICATION

### Aggregate: NotificationTemplate
```
NotificationTemplate
├── templateId: TemplateId
├── tenantId: TenantId
├── type: Email|WhatsApp|SMS
├── name: string
├── subject: string?
├── body: string (with placeholders)
├── variables: string[]
└── status: Active|Inactive
```

### Service: NotificationService
- Sends emails via Nodemailer
- Sends WhatsApp messages (future)
- Uses templates with variable substitution
- Queue-based (Bull) for reliability
- Tracks delivery status

---

## Bounded Context: APPROVAL

### Aggregate: ApprovalWorkflow
```
ApprovalRequest
├── requestId: RequestId
├── tenantId: TenantId
├── type: Receipt|Refund|Custom
├── referenceId: string
├── requestedBy: UserId
├── status: Pending|Approved|Rejected
├── approvedBy: UserId?
├── approvedAt: Date?
└── comments: string?
```

---

## Module Communication Rules

1. **Synchronous (within monolith)**: Module A calls Module B's application service directly via dependency injection. Never call another module's repository directly.

2. **Event-based (loose coupling)**: Use in-process event emitter for cross-module side effects:
   - `PaymentReceived` -> Communication module sends receipt email
   - `InstallmentOverdue` -> Communication module sends reminder
   - `PaymentReceived` -> DayBook module creates entry

3. **Shared data**: Only through Shared Kernel value objects. Never share entities across contexts.
