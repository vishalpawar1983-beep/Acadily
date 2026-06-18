import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { logger } from "../logger/PinoLogger.js";
import { JwtTokenService } from "../../../modules/auth/infrastructure/JwtTokenService.js";
import { MongoUserRepository } from "../../../modules/auth/infrastructure/MongoUserRepository.js";
import { GetNextReceiptNumber } from "../../../modules/receipt/application/GetNextReceiptNumber.js";
import { MongoReceiptCounterRepository } from "../../../modules/receipt/infrastructure/MongoReceiptCounterRepository.js";
import { MongoTenantRepository } from "../../../modules/tenant/infrastructure/MongoTenantRepository.js";
import bcryptjs from "bcryptjs";
import { EmailService } from "../email/EmailService.js";
import { TemplateEngine } from "../email/TemplateEngine.js";

const tokenService = new JwtTokenService();
const userRepo = new MongoUserRepository();
const emailService = new EmailService();

/**
 * Legacy API Gateway
 *
 * Maps old frontend routes (/api/*) to new DDD routes (/api/v1/*).
 * Includes response transformation: DDD envelope unwrapping, id→_id mapping.
 */

/** Extract a single string param from Express req.params (which may return string | string[]) */
function p(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Indian financial year start year for a given date.
 * FY runs 1 April → 31 March; Jan–Mar belong to the FY that started the previous April.
 * e.g. 2026-06-10 → 2026, 2027-02-10 → 2026.
 */
function financialYearStartYear(date: Date): number {
  return date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
}

/**
 * Build a student roll number.
 * When a tenant has configured a prefix (e.g. "OSC") the roll number is rendered as
 * `PREFIX/FY-START-YEAR/NUMBER` (e.g. "OSC/2026/1312"). With no prefix configured we
 * keep the legacy plain-number behaviour for backward compatibility.
 */
function formatRollNumber(prefix: string, num: number, date: Date): string {
  const clean = (prefix || "").trim();
  if (!clean) return String(num);
  return `${clean}/${financialYearStartYear(date)}/${num}`;
}

/** Recursively map `id` → `_id` on objects and arrays */
function mapIdsDeep(value: any): any {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(mapIdsDeep);
  if (typeof value !== "object" || value instanceof Date) return value;

  const result: any = {};
  for (const [k, v] of Object.entries(value)) {
    const key = k === "id" ? "_id" : k;
    result[key] = Array.isArray(v) ? v.map(mapIdsDeep) : v;
  }
  return result;
}

function normalizeCompanyId(raw: any): string | null {
  if (!raw) return null;
  if (typeof raw === "object") {
    if (raw._id) return String(raw._id);
    if (raw.companyId) return String(raw.companyId);
    return null;
  }
  return String(raw);
}

/**
 * Map DDD student to legacy frontend format.
 * DDD uses nested objects (contact, enrollment); legacy uses flat fields.
 * courseMap: optional Map of courseId → raw course doc for populating courseName.
 */
function mapStudentToLegacy(s: any, courseMap?: Map<string, any>): any {
  if (!s || typeof s !== "object") return s;
  const contact = s.contact || {};
  const enrollment = s.enrollment || {};
  const courseId = enrollment.courseId || s.courseName;

  // Populate courseName with full course object if available
  let courseNameField: any = courseId;
  if (courseMap && courseId) {
    const course = courseMap.get(String(courseId));
    if (course) {
      courseNameField = {
        _id: course._legacyId || course._id?.toString(),
        courseName: course.name || course.courseName,
        courseFees: course.fees || course.courseFees,
        courseType: course.courseType,
        numberOfYears: course.durationYears,
        category: course._resolvedCategoryId || course.category,
        createdBy: course.createdBy,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        __v: 0,
      };
    }
  }

  return {
    _id: s._legacyId || s._id?.toString() || s.id,
    companyName:
      typeof s.companyName === "object" && s.companyName?._id
        ? String(s.companyName._id)
        : s.companyName
          ? String(s.companyName)
          : enrollment.companyId
            ? String(enrollment.companyId)
            : null,
    rollNumber:
      typeof s.rollNumber === "string"
        ? Number(s.rollNumber) || s.rollNumber
        : s.rollNumber,
    image: s.image || "",
    name: s.name || [s.firstName, s.lastName].filter(Boolean).join(" "),
    father_name: s.fatherName || s.father_name || "",
    mobile_number: contact.mobile || s.mobile_number || "",
    phone_number: contact.phone || s.phone_number || "",
    present_address: contact.address || s.present_address || "",
    date_of_birth: s.dateOfBirth || s.date_of_birth || null,
    city: contact.city || s.city || "",
    email: contact.email || s.email || "",
    education_qualification:
      s.educationQualification || s.education_qualification || "",
    select_course: enrollment.courseName || s.select_course || "",
    course_fees: enrollment.courseFees ?? s.course_fees ?? 0,
    discount: enrollment.discount ?? s.discount ?? 0,
    netCourseFees: enrollment.netFees ?? s.netCourseFees ?? 0,
    date_of_joining: enrollment.dateOfJoining || s.date_of_joining || null,
    installment_duration:
      s.installment_duration && s.installment_duration !== "null"
        ? s.installment_duration
        : null,
    no_of_installments:
      enrollment.installmentCount ?? s.no_of_installments ?? 0,
    no_of_installments_amount:
      enrollment.installmentAmount ?? s.no_of_installments_amount ?? 0,
    courseName: courseNameField,
    totalPaid: enrollment.totalPaid ?? s.totalPaid ?? 0,
    installmentPaymentSkipMonth: s.installmentPaymentSkipMonth ?? 0,
    skipMonthIncremented: s.skipMonthIncremented ?? false,
    remainderSent: s.remainderSent ?? false,
    dropOutStudent: s.status === "dropout" || (s.dropOutStudent ?? false),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    __v: 0,
    courseduration:
      s.courseduration && s.courseduration !== "null"
        ? s.courseduration
        : s.courseDuration && s.courseDuration !== "null"
          ? s.courseDuration
          : null,
    down_payment: enrollment.downPayment ?? s.down_payment ?? 0,
    no_of_installments_expireTimeandAmount:
      s.no_of_installments_expireTimeandAmount &&
      s.no_of_installments_expireTimeandAmount !== "null"
        ? s.no_of_installments_expireTimeandAmount
        : null,
    remainingCourseFees: enrollment.remainingFees ?? s.remainingCourseFees ?? 0,
    student_status: s.status || s.student_status || "active",
    message: s.message || "",
    // Fixed installment mode fields
    admission_fees: s.admission_fees ?? 0,
    fixed_installment: s.fixed_installment || "",
    batch_starting_fees: s.batch_starting_fees ?? 0,
    // Tenant-defined custom admission fields (Personal Details section)
    customFields: s.customFields || {},
  };
}

/** Resolve an array of userId strings to a Map<userId, fullName> */
async function resolveUserNames(
  db: any,
  userIds: (string | undefined)[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))] as string[];
  const nameMap = new Map<string, string>();
  if (uniqueIds.length === 0) return nameMap;
  try {
    const { ObjectId } = await import("mongodb");
    const objectIds = uniqueIds
      .map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    if (objectIds.length > 0) {
      const users = await db
        .collection("users")
        .find({ _id: { $in: objectIds } })
        .toArray();
      for (const u of users) {
        // Support both DDD (firstName/lastName), legacy flat (fName/lName), and single-name field
        const name = (
          u.name ||
          (
            (u.firstName || u.fName || "") +
            " " +
            (u.lastName || u.lName || "")
          ).trim()
        );
        if (name) nameMap.set(u._id.toString(), String(name).trim());
      }
    }
  } catch {
    /* ignore resolution failures — fall back to raw id */
  }
  return nameMap;
}

type RouteMapping = {
  legacyMethod: string;
  legacyPath: string;
  newMethod?: string; // defaults to same as legacyMethod
  newPath: string; // can use :param placeholders
  bodyTransformer?: (body: any) => any; // transform request body before forwarding
  paramExtractor?: (req: Request) => Record<string, string>; // extract :param values from body when not in URL
  keepEnvelope?: boolean; // skip envelope unwrap — frontend reads res.data.success directly
};

// ── Route Mapping Table ──
const routeMappings: RouteMapping[] = [
  // ── Auth / Users ──
  // POST /users/auth is handled separately above (response transformation)
  {
    legacyMethod: "POST",
    legacyPath: "/register",
    newPath: "/api/v1/auth/register",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/users/requestPassword",
    newPath: "/api/v1/users/request-password-reset",
  },
  // POST /users/verifyToken is handled separately above (JWT validation + user profile)
  // POST /users/verify-otp and /users/resend-otp — explicit handlers below (OTP flow)
  {
    legacyMethod: "POST",
    legacyPath: "/reset-password/:id/:token",
    newPath: "/api/v1/users/reset-password",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/reset-password/:token",
    newPath: "/api/v1/users/reset-password",
  },
  // GET /users handled by explicit handler (field mapping: firstName→fName)
  // POST /users — explicit handler below (maps fName→firstName, handles legacy field names)
  // GET /users/:id and PUT /users/:id — explicit handlers below (legacy field names + _legacyId)
  // DELETE /users/:id — explicit handler below (needs _legacyId resolution)
  // GET /user-role handled by explicit transformer in createLegacyGateway()
  // { legacyMethod: 'GET', legacyPath: '/user-role', newPath: '/api/v1/rbac' },

  // ── Students ──
  {
    legacyMethod: "POST",
    legacyPath: "/students",
    newPath: "/api/v1/students",
  },
  // GET /students, /students/company/:id, /students/company/:id/course/:id, /students/:email
  // handled by explicit handlers in createLegacyGateway()
  // GET /students/commission and /students/commissionList handled by explicit handlers below
  // (need to populate studentName as student object with image field)
  {
    legacyMethod: "POST",
    legacyPath: "/students/createAlertStudentPendingFees/add",
    newPath: "/api/v1/students/alerts",
    // Frontend sends: { Date (Date obj), RemainderDateAndTime (Date obj), Status, particulars, studentId }
    // DDD expects:    { date (string), reminderDateTime (string), status, particulars, studentId }
    bodyTransformer: (body: any) => ({
      date: body.date ?? body.Date
        ? new Date(body.date ?? body.Date).toISOString()
        : undefined,
      reminderDateTime: body.reminderDateTime ?? body.RemainderDateAndTime
        ? new Date(body.reminderDateTime ?? body.RemainderDateAndTime).toISOString()
        : undefined,
      status: body.status ?? body.Status,
      particulars: body.particulars,
      studentId: body.studentId,
    }),
  },
  {
    legacyMethod: "GET",
    legacyPath: "/students/createAlertStudentPendingFees/get",
    newPath: "/api/v1/students/alerts",
  },
  {
    legacyMethod: "GET",
    legacyPath: "/students/getStudentAlertStudentPendingFees",
    newPath: "/api/v1/students/alerts",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/students/sendWarningMail",
    newPath: "/api/v1/students/:id/send-warning-mail",
    paramExtractor: (req: Request) => ({
      id: req.body?.studentId || req.body?._id || req.body?.id,
    }),
    keepEnvelope: true,
  },
  {
    legacyMethod: "POST",
    legacyPath: "/students/sendAddmissionCancellationMail",
    newPath: "/api/v1/students/:id/send-cancellation-mail",
    paramExtractor: (req: Request) => ({
      id:
        req.body?.studentInfo ||
        req.body?.studentId ||
        req.body?.student ||
        req.body?.id,
    }),
    keepEnvelope: true,
  },
  // POST /students/sendCourseChangeEmail — explicit handler below (different payload format)
  {
    legacyMethod: "POST",
    legacyPath: "/students/sendMailStudent",
    newPath: "/api/v1/students/:id/send-receipt-mail",
    paramExtractor: (req: Request) => ({
      id: req.body?.studentId || req.body?.studentInfo || req.body?._id || req.body?.id,
    }),
    keepEnvelope: true,
  },
  {
    legacyMethod: "POST",
    legacyPath: "/students/sendMailToSelectedStudents",
    newPath: "/api/v1/students/send-bulk-mail",
    keepEnvelope: true,
  },
  {
    legacyMethod: "GET",
    legacyPath: "/students/dropOutStudents/:id",
    newMethod: "PATCH",
    newPath: "/api/v1/students/:id/dropout",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/students/dropOutStudents/:id",
    newMethod: "PATCH",
    newPath: "/api/v1/students/:id/dropout",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/students/renewStudentCourseFees/:id",
    newPath: "/api/v1/students/:id/renew",
  },
  // GET /students/search — explicit handler below (search by name/email)
  // GET /students/feesCollection — explicit handler below (monthly fee collection report)
  {
    legacyMethod: "GET",
    legacyPath: "/students/:id",
    newPath: "/api/v1/students/:id",
  },
  // PUT /students/:id — explicit handler below (FormData with legacy field names + image upload)
  {
    legacyMethod: "DELETE",
    legacyPath: "/students/:id",
    newPath: "/api/v1/students/:id",
  },

  // ── Courses ──
  // POST /courses — explicit handler below (legacy field names + ref IDs need resolution)
  // GET /courses handled by explicit transformer in createLegacyGateway()
  // GET /courses/categories, /courses/courseType, /courses/numberOfYears handled by explicit handlers
  // (DDD returns { success, data: {...} } envelope + different field names)
  {
    legacyMethod: "POST",
    legacyPath: "/courses/addCategory",
    newPath: "/api/v1/categories",
    bodyTransformer: (b: any) => ({ name: b.category || b.name }),
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/courses/category/:id",
    newPath: "/api/v1/categories/:id",
    bodyTransformer: (b: any) => ({ name: b.category || b.name }),
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/courses/category/:id",
    newPath: "/api/v1/categories/:id",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/courses/courseType",
    newPath: "/api/v1/course-types",
    bodyTransformer: (b: any) => ({ name: b.courseType || b.name }),
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/courses/courseType/:id",
    newPath: "/api/v1/course-types/:id",
    bodyTransformer: (b: any) => ({ name: b.courseType || b.name }),
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/courses/courseType/:id",
    newPath: "/api/v1/course-types/:id",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/courses/numberOfYears",
    newPath: "/api/v1/number-of-years",
    bodyTransformer: (b: any) => ({
      value: Number(b.numberOfYears || b.value),
    }),
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/courses/numberOfYears/:id",
    newPath: "/api/v1/number-of-years/:id",
    bodyTransformer: (b: any) => ({
      value: Number(b.numberOfYears || b.value),
    }),
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/courses/numberOfYears/:id",
    newPath: "/api/v1/number-of-years/:id",
  },
  {
    legacyMethod: "GET",
    legacyPath: "/courses/:id",
    newPath: "/api/v1/courses/:id",
  },
  // PUT /courses/:id — explicit handler below (legacy field names + numberOfYears ID resolution)
  {
    legacyMethod: "DELETE",
    legacyPath: "/courses/:id",
    newPath: "/api/v1/courses/:id",
  },

  // ── Fees ──
  // POST /courseFees — explicit handler below (legacy field names differ from DDD)
  { legacyMethod: "GET", legacyPath: "/courseFees", newPath: "/api/v1/fees" },
  // GET /courseFees/allCourseFess and POST /courseFees/get-not-paid-students handled by explicit handlers
  {
    legacyMethod: "GET",
    legacyPath: "/courseFees/nextinstallment",
    newPath: "/api/v1/installments/overdue",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/courseFees/online-payment",
    newPath: "/api/v1/payment-gateway/initiate",
  },
  // GET /courseFees/studentFees/:studentId — handled by explicit handler below (needs raw coursefees collection)
  // GET /courseFees/paymentInstallmentFees/:companyId handled by explicit handler
  {
    legacyMethod: "POST",
    legacyPath: "/courseFees/payment/success",
    newPath: "/api/v1/payment-gateway/callback",
  },
  {
    legacyMethod: "GET",
    legacyPath: "/courseFees/:id",
    newPath: "/api/v1/fees/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/courseFees/:id",
    newPath: "/api/v1/fees/:id",
  },
  // DELETE /courseFees/:id — explicit handler below (recalculate student totals from both collections)

  // ── Attendance — all handled by explicit handlers below ──
  // POST /attendence, GET /attendence, GET /attendence/:batchId, GET /attendence/student/:studentId
  // POST /attendence/all-stu-attendance

  // ── Batches ──
  { legacyMethod: "POST", legacyPath: "/batches", newPath: "/api/v1/batches" },
  { legacyMethod: "GET", legacyPath: "/batches", newPath: "/api/v1/batches" },
  {
    legacyMethod: "GET",
    legacyPath: "/batches/pending/all",
    newPath: "/api/v1/batches/pending",
  },
  // GET /batches/company/:companyId handled by explicit handler (response format + trainer populate)
  // GET /batches/:id handled by explicit handler (populate trainer + students)
  {
    legacyMethod: "PUT",
    legacyPath: "/batches/:id",
    newPath: "/api/v1/batches/:id",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/batches/:id",
    newPath: "/api/v1/batches/:id",
  },
  // Batch student operations (legacy /student singular → DDD /students plural)
  // POST /batches/:id/student — explicit handler below (transforms subject IDs → subjectNames)
  // GET /batches/:id/student/:studentId/progress — explicit handler below (resolve _legacyId)
  // PUT /batches/:id/student/:studentId/subject/:subjectId — explicit handler below
  // DELETE /batches/:id/student/:studentId — explicit handler below (needs _legacyId → real _id resolution)

  // ── DayBook ──
  // POST /dayBook/addAccount — explicit handler below (preserves companyId not in DDD model)
  {
    legacyMethod: "GET",
    legacyPath: "/dayBook/singleAccountAccount/:id",
    newPath: "/api/v1/daybook/accounts/:id",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/dayBook/addData",
    newPath: "/api/v1/daybook/entries",
  },
  // GET /dayBook/data handled by explicit handler below (dashboard earnings)
  {
    legacyMethod: "GET",
    legacyPath: "/dayBook/data/:id",
    newPath: "/api/v1/daybook/entries/:id",
  },
  // PUT /dayBook/data/:id — explicit handler below (legacy ID support)
  // DELETE /dayBook/data/:id — explicit handler below (legacy ID support)
  // GET /dayBook/singleAccountDayBookLists/:id — explicit handler below (filter entries by account ID)
  {
    legacyMethod: "POST",
    legacyPath: "/dayBook",
    newPath: "/api/v1/daybook/entries",
  },
  // GET /dayBook — explicit handler below (need companyId field not in DDD model)
  {
    legacyMethod: "GET",
    legacyPath: "/dayBook/:id",
    newPath: "/api/v1/daybook/entries/:id",
  },
  // PUT /dayBook/:id — explicit handler below (updates account, not entry)
  // DELETE /dayBook/:id — explicit handler below (deletes account, not entry)

  // ── Subjects ──
  {
    legacyMethod: "POST",
    legacyPath: "/subjects/add",
    newPath: "/api/v1/subjects",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/subjects",
    newPath: "/api/v1/subjects",
    bodyTransformer: (b: any) => {
      const result: any = {
        subjectName: b.subjectName,
        subjectCode: b.subjectCode,
        fullMarks: Number(b.fullMarks || 0),
        passMarks: Number(b.passMarks || 0),
        semYear: b.semYear || "",
      };
      const courseId = b.course || b.courseId;
      if (courseId) result.courseId = courseId;
      return result;
    },
  },
  // GET /subjects — explicit handler below (resolve addedBy userId → name)
  // GET /subjects/based-on-student/:id — explicit handler below (student→course→subjects lookup)
  // POST /subjects/subject-mail — explicit handler below (send marks email)
  {
    legacyMethod: "GET",
    legacyPath: "/subjects/marks",
    newPath: "/api/v1/marks",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/subjects/marks",
    newPath: "/api/v1/marks",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/subjects/marks/bulk",
    newPath: "/api/v1/marks/bulk",
  },
  {
    legacyMethod: "GET",
    legacyPath: "/subjects/marks/:id",
    newPath: "/api/v1/marks/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/subjects/marks/:id",
    newPath: "/api/v1/marks/:id",
  },
  {
    legacyMethod: "GET",
    legacyPath: "/subjects/:id",
    newPath: "/api/v1/subjects/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/subjects/:id",
    newPath: "/api/v1/subjects/:id",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/subjects/:id",
    newPath: "/api/v1/subjects/:id",
  },

  // ── Teachers ──
  {
    legacyMethod: "POST",
    legacyPath: "/teachers",
    newPath: "/api/v1/teachers",
  },
  { legacyMethod: "GET", legacyPath: "/teachers", newPath: "/api/v1/teachers" },
  {
    legacyMethod: "GET",
    legacyPath: "/teachers/:id",
    newPath: "/api/v1/teachers/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/teachers/:id",
    newPath: "/api/v1/teachers/:id",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/teachers/:id",
    newPath: "/api/v1/teachers/:id",
  },

  // ── Issues ──
  {
    legacyMethod: "POST",
    legacyPath: "/student-issues",
    newPath: "/api/v1/issues",
  },
  {
    legacyMethod: "GET",
    legacyPath: "/student-issues",
    newPath: "/api/v1/issues",
  },
  // GET/POST /student-issues/showStudentDashboard handled by explicit handlers below (dashboard flagged students)
  // GET /student-issues/showStudentDashboard/:studentId handled by explicit handler below
  {
    legacyMethod: "GET",
    legacyPath: "/student-issues/:id",
    newPath: "/api/v1/issues/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/student-issues/:id",
    newPath: "/api/v1/issues/:id",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/student-issues/:id",
    newPath: "/api/v1/issues/:id",
  },

  // ── Notes ──
  {
    legacyMethod: "POST",
    legacyPath: "/student-notes",
    newPath: "/api/v1/notes",
    // Legacy frontend sends userId (student _id) and may omit addedBy
    bodyTransformer: (body: any) => {
      const out = { ...body };
      if (out.userId && !out.studentId) {
        out.studentId = String(out.userId);
        delete out.userId;
      }
      // companyId is resolved from auth context, not needed in body
      delete out.companyId;
      return out;
    },
  },
  // GET /student-notes handled by explicit handler in createLegacyGateway()
  {
    legacyMethod: "GET",
    legacyPath: "/student-notes/:id",
    newPath: "/api/v1/notes/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/student-notes/:id",
    newPath: "/api/v1/notes/:id",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/student-notes/:id",
    newPath: "/api/v1/notes/:id",
  },

  // ── Payment Options ──
  // GET /paymentOptions handled by explicit handler (field name mapping: optionName → name)
  {
    legacyMethod: "POST",
    legacyPath: "/paymentOptions",
    newPath: "/api/v1/payment-options",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/paymentOptions/:id",
    newPath: "/api/v1/payment-options/:id",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/paymentOptions/:id",
    newPath: "/api/v1/payment-options/:id",
  },

  // ── Custom Fields ──
  // Custom Fields — all handled by explicit handlers below (DDD schema mismatch: name→fieldName, type→fieldType, options format differs)

  // ── Email Templates ──
  // GET /email/allTemplates handled by explicit handler
  {
    legacyMethod: "POST",
    legacyPath: "/email/template",
    newPath: "/api/v1/email-templates",
  },

  // ── Custom Forms ──
  // Custom Forms (add-form) — all handled by explicit handlers below

  // ── Form Submissions — all handled by explicit handlers below ──
  // POST /submit-form, POST /submit-form/enquiry-form, GET /submit-form, GET/PUT/DELETE /submit-form/:id

  // ── Select Fields ──
  {
    legacyMethod: "POST",
    legacyPath: "/select-field",
    newPath: "/api/v1/custom-forms/selects",
  },
  // GET /select-field handled by explicit handler in createLegacyGateway()
  // GET /select-field/:id handled by explicit handler in createLegacyGateway() (_legacyId resolution)
  // PUT /select-field/:id handled by explicit handler in createLegacyGateway() (_legacyId resolution)

  // ── Labs ──
  { legacyMethod: "POST", legacyPath: "/add-lab", newPath: "/api/v1/labs" },
  { legacyMethod: "GET", legacyPath: "/add-lab", newPath: "/api/v1/labs" },
  {
    legacyMethod: "GET",
    legacyPath: "/add-lab/:id",
    newPath: "/api/v1/labs/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/add-lab/:id",
    newPath: "/api/v1/labs/:id",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/add-lab/:id",
    newPath: "/api/v1/labs/:id",
  },

  // ── Timings ──
  // POST + GET /add-timing handled by explicit handlers (need to persist/return companyId)
  // { legacyMethod: 'POST', legacyPath: '/add-timing', newPath: '/api/v1/timings' },
  // { legacyMethod: 'GET', legacyPath: '/add-timing', newPath: '/api/v1/timings' },
  {
    legacyMethod: "GET",
    legacyPath: "/add-timing/:id",
    newPath: "/api/v1/timings/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/add-timing/:id",
    newPath: "/api/v1/timings/:id",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/add-timing/:id",
    newPath: "/api/v1/timings/:id",
  },

  // ── Trainers ──
  // All trainer routes handled by explicit handlers (legacy field names differ from DDD)
  // POST /add-trainer — explicit handler below (multipart FormData)
  // GET /add-trainer — explicit handler below (raw collection, legacy field names)
  // GET /add-trainer/:id, PUT /add-trainer/:id, DELETE /add-trainer/:id — explicit handlers below

  // ── Approvals ──
  // POST /receipt-approval — explicit handler below (upsert by receiptId)
  // GET /receipt-approval  — explicit handler below (populates reciept from coursefees/feepayments)

  // ── Commissions ──
  // POST/PUT/DELETE /students/commission — explicit handlers below. The DDD
  // commission model has no companyId/narration, but the daybook total filters
  // rows by companyId, so commissions must persist companyId to count.

  // ── Completions ──
  {
    legacyMethod: "POST",
    legacyPath: "/complete/course/students",
    newPath: "/api/v1/completions",
  },
  {
    legacyMethod: "GET",
    legacyPath: "/complete/course/students",
    newPath: "/api/v1/completions",
  },

  // ── Settings / Email Remainder ──
  // emailRemainder/* — all handled by explicit handlers (data in _legacySettings)
  {
    legacyMethod: "GET",
    legacyPath: "/whatsAppMessageSuggestion/status",
    newPath: "/api/v1/settings/whatsapp-message",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/whatsAppMessageSuggestion/status",
    newPath: "/api/v1/settings/whatsapp-message",
  },

  // ── GST Suggestions → Settings ──
  {
    legacyMethod: "GET",
    legacyPath: "/student-gst-suggestions",
    newPath: "/api/v1/settings/student-gst",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/student-gst-suggestions/add",
    newMethod: "PUT",
    newPath: "/api/v1/settings/student-gst",
  },

  // ── Form Layout ──
  // GET /columns, GET /rows handled by explicit handlers in createLegacyGateway()
  {
    legacyMethod: "POST",
    legacyPath: "/columns/save",
    newPath: "/api/v1/form-layout/columns",
  },
  {
    legacyMethod: "POST",
    legacyPath: "/rows/save",
    newPath: "/api/v1/form-layout/rows",
  },
  {
    legacyMethod: "DELETE",
    legacyPath: "/rows/:id",
    newPath: "/api/v1/form-layout/rows/:id",
  },

  // ── Email Logs ──
  // GET /allMails — explicit handler below (no auth required, queries raw emaillogs collection)

  // ── Admission Forms ──
  // POST /addmission_form — explicit handler below (legacy flat form → student creation)
  // GET /addmission_form/:id handled by explicit handler below (legacy addmission_form = student profile)

  // ── Installments ──
  {
    legacyMethod: "GET",
    legacyPath: "/installments",
    newPath: "/api/v1/installments",
  },
  {
    legacyMethod: "GET",
    legacyPath: "/installments/:id",
    newPath: "/api/v1/installments/:id",
  },
  {
    legacyMethod: "PUT",
    legacyPath: "/installments/:id",
    newPath: "/api/v1/installments/:id",
  },

  // ── Images (serve from uploads) ──
  // GET /images/:filename — explicit handler below (serves from uploads with default avatar fallback)
  {
    legacyMethod: "POST",
    legacyPath: "/images",
    newPath: "/api/v1/students/:id/upload-photo",
  },

  // ── Company — all handled by explicit handlers below (FormData + logo upload) ──
];

/**
 * Build the Express router from the mapping table.
 * For each mapping, register a handler that rewrites the URL and forwards internally.
 */
export function createLegacyGateway(): Router {
  const gateway = Router();

  // ── Verify Token (legacy: validates JWT and returns user profile) ──
  // Profile fields (firstName, lastName, email) are embedded in the JWT so we
  // can respond without a DB round-trip — eliminating the cold-start delay on
  // every page load. Falls back to a DB lookup for tokens issued before this change.
  gateway.post("/users/verifyToken", async (req: Request, res: Response) => {
    try {
      const token = req.body.api_token;
      if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
      }
      const payload = tokenService.verifyAccessToken(token);

      if (payload.firstName !== undefined && payload.email) {
        // Fast path: profile data already in token — no DB hit needed
        let trainerCompanyId: string | undefined;
        if (payload.role === "Trainer") {
          try {
            const { default: mongoose } = await import("mongoose");
            const { Types: MongoTypes } = mongoose;
            // 1. Try trainer entity by email (created via Add Trainer page)
            if (payload.email) {
              const trainerDoc = await mongoose.connection
                .db!.collection("trainers")
                .findOne(
                  {
                    tenantId: payload.tenantId,
                    $or: [{ email: payload.email }, { trainerEmail: payload.email }],
                  },
                  { projection: { companyId: 1 } },
                );
              const rawId = trainerDoc?.companyId;
              trainerCompanyId = rawId ? String(rawId) : undefined;
            }
            // 2. Fallback: read companyId (or first companyIds element) from user document
            if (!trainerCompanyId) {
              const userDoc = await mongoose.connection
                .db!.collection("users")
                .findOne(
                  { _id: new MongoTypes.ObjectId(payload.userId), tenantId: payload.tenantId },
                  { projection: { companyId: 1, companyIds: 1 } },
                );
              const rawId = userDoc?.companyId ||
                (Array.isArray(userDoc?.companyIds) && userDoc.companyIds.length > 0
                  ? userDoc.companyIds[0]
                  : undefined);
              trainerCompanyId = rawId ? String(rawId) : undefined;
            }
            logger.info({ trainerCompanyId, userId: payload.userId }, "verifyToken: trainer companyId resolved");
          } catch (trainerErr) {
            logger.warn({ trainerErr, userId: payload.userId }, "verifyToken: trainer companyId lookup failed, continuing without it");
          }
        }
        let resolvedCompanyIdFast: string | undefined = trainerCompanyId;
        if (!resolvedCompanyIdFast && payload.role !== "Trainer") {
          try {
            const { default: mongoose } = await import("mongoose");
            const batchCat = await mongoose.connection.db!.collection("batchcategories")
              .findOne({ tenantId: payload.tenantId }, { projection: { _id: 1, _legacyId: 1 } });
            if (batchCat) {
              resolvedCompanyIdFast = batchCat._legacyId ? String(batchCat._legacyId) : batchCat._id.toString();
            }
          } catch { /* non-fatal */ }
        }
        res.json({
          id: payload.userId,
          email: payload.email,
          first_name: payload.firstName,
          last_name: payload.lastName ?? "",
          role: payload.role,
          api_token: token,
          ...(resolvedCompanyIdFast ? { companyId: resolvedCompanyIdFast } : {}),
        });
        return;
      }

      // Fallback for tokens issued before profile fields were added
      const user = await userRepo.findById(payload.tenantId, payload.userId);
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }
      let trainerCompanyIdFallback: string | undefined;
      if (user.role === "Trainer") {
        try {
          const { default: mongoose } = await import("mongoose");
          const { Types: MongoTypes } = mongoose;
          if (user.email) {
            const trainerDoc = await mongoose.connection
              .db!.collection("trainers")
              .findOne(
                {
                  tenantId: payload.tenantId,
                  $or: [{ email: user.email }, { trainerEmail: user.email }],
                },
                { projection: { companyId: 1 } },
              );
            const rawId = trainerDoc?.companyId;
            trainerCompanyIdFallback = rawId ? String(rawId) : undefined;
          }
          if (!trainerCompanyIdFallback) {
            const userDoc = await mongoose.connection
              .db!.collection("users")
              .findOne(
                { _id: new MongoTypes.ObjectId(user.id), tenantId: payload.tenantId },
                { projection: { companyId: 1, companyIds: 1 } },
              );
            const rawId = userDoc?.companyId ||
              (Array.isArray(userDoc?.companyIds) && userDoc.companyIds.length > 0
                ? userDoc.companyIds[0]
                : undefined);
            trainerCompanyIdFallback = rawId ? String(rawId) : undefined;
          }
        } catch (trainerErr) {
          logger.warn({ trainerErr }, "verifyToken: trainer companyId fallback lookup failed");
        }
      } else {
        try {
          const { default: mongoose } = await import("mongoose");
          const batchCat = await mongoose.connection.db!.collection("batchcategories")
            .findOne({ tenantId: payload.tenantId }, { projection: { _id: 1, _legacyId: 1 } });
          if (batchCat) {
            trainerCompanyIdFallback = batchCat._legacyId ? String(batchCat._legacyId) : batchCat._id.toString();
          }
        } catch { /* non-fatal */ }
      }
      res.json({
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        api_token: token,
        ...(trainerCompanyIdFallback ? { companyId: trainerCompanyIdFallback } : {}),
      });
    } catch {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  });

  /** Map a raw batchcategories doc → legacy company shape, falling back to
   *  alternate field names used by the DDD BatchCategory model so that
   *  companies created via either path always have all fields present. */
  function mapCompanyDoc(c: any): any {
    return {
      _id: c._legacyId || c._id.toString(),
      logo: c.logo || "",
      companyName: c.categoryName || c.companyName || c.name || "",
      email: c.email || c.companyEmail || c.contactEmail || "",
      companyPhone: c.companyPhone || c.phone || c.contactPhone || "",
      companyWebsite: c.companyWebsite || c.website || "",
      companyAddress: c.companyAddress || c.address || "",
      reciptNumber: c.reciptNumber || c.receiptNumber || c.receiptPrefix || "",
      gst: c.gst || c.gstNumber || "",
      isGstBased: c.isGstBased || c.gstBased || "No",
      // approvalStatus → status for frontend statusBadge()
      status: c.approvalStatus || c.status || "approved",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt || c.createdAt,
      __v: 0,
    };
  }

  // ── Company list ──
  // Prod: plain array [{ _id, logo, companyName, email, companyPhone, companyWebsite, companyAddress, reciptNumber, gst, isGstBased, createdAt, updatedAt, __v }]
  gateway.get("/company", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const docs = await mongoose.connection
        .db!.collection("batchcategories")
        .find({ tenantId })
        .toArray();
      res.json(docs.map(mapCompanyDoc));
    } catch (err) {
      logger.error({ err }, "Legacy company list query failed");
      res.json([]);
    }
  });

  // ── Pending companies (must be before /company/:id to avoid param clash) ──
  gateway.get("/company/pending", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const docs = await mongoose.connection
        .db!.collection("batchcategories")
        .find({ tenantId, approvalStatus: "pending" })
        .toArray();
      res.json(docs.map(mapCompanyDoc));
    } catch (err) {
      logger.error({ err }, "Legacy GET /company/pending failed");
      res.json([]);
    }
  });

  // ── Company approve / reject ──
  gateway.patch("/company/:id/approve", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
      const { default: mongoose } = await import("mongoose");
      const id = String(req.params.id);
      const oid = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
      if (!oid) { res.status(400).json({ message: "Invalid id" }); return; }
      await mongoose.connection.db!.collection("batchcategories").updateOne(
        { _id: oid, tenantId },
        { $set: { approvalStatus: "approved", updatedAt: new Date() } },
      );
      res.json({ success: true, message: "Company approved" });
    } catch (err) {
      logger.error({ err }, "Legacy PATCH /company/:id/approve failed");
      res.status(500).json({ message: "Internal error" });
    }
  });

  gateway.patch("/company/:id/reject", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) { res.status(401).json({ error: "Unauthorized" }); return; }
      const { default: mongoose } = await import("mongoose");
      const id = String(req.params.id);
      const oid = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
      if (!oid) { res.status(400).json({ message: "Invalid id" }); return; }
      await mongoose.connection.db!.collection("batchcategories").updateOne(
        { _id: oid, tenantId },
        { $set: { approvalStatus: "rejected", updatedAt: new Date() } },
      );
      res.json({ success: true, message: "Company rejected" });
    } catch (err) {
      logger.error({ err }, "Legacy PATCH /company/:id/reject failed");
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Company by ID ──
  gateway.get("/company/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json(null);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const rawId = p(req, "id");
      if (
        !rawId ||
        rawId === "undefined" ||
        rawId === "[object Object]" ||
        rawId === "null"
      ) {
        res.json(null);
        return;
      }
      // Accept both legacy string IDs and ObjectIds
      const orClauses: any[] = [{ _legacyId: rawId }];
      if (mongoose.Types.ObjectId.isValid(rawId))
        orClauses.push({ _id: new mongoose.Types.ObjectId(rawId) });
      let c = await mongoose.connection
        .db!.collection("batchcategories")
        .findOne({ tenantId, $or: orClauses });

      // Fallback: rawId might be a form definition _id (from /update-form/:formId routing).
      // Resolve to the company via formdefinitions.companyId so the form builder gets
      // the right company name/context.
      if (!c && mongoose.Types.ObjectId.isValid(rawId)) {
        const formDef = await mongoose.connection
          .db!.collection("formdefinitions")
          .findOne({ _id: new mongoose.Types.ObjectId(rawId), tenantId });
        if (formDef?.companyId) {
          const cId = String(formDef.companyId);
          const compOrClauses: any[] = [{ _legacyId: cId }];
          if (mongoose.Types.ObjectId.isValid(cId))
            compOrClauses.push({ _id: new mongoose.Types.ObjectId(cId) });
          c = await mongoose.connection
            .db!.collection("batchcategories")
            .findOne({ tenantId, $or: compOrClauses });
        }
      }

      if (!c) {
        res.status(404).json({ message: "Company not found" });
        return;
      }
      res.json(mapCompanyDoc(c));
    } catch (err) {
      logger.error({ err }, "Legacy company/:id query failed");
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Company POST — FormData with logo upload ──
  gateway.post("/company", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ message: "Auth required" });
        return;
      }

      // ── Limit: max 2 companies per tenant ──
      const { default: mongooseChk } = await import("mongoose");
      const dbChk = mongooseChk.connection.db!;
      const companyCount = await dbChk.collection("batchcategories").countDocuments({ tenantId });
      if (companyCount >= 2) {
        res.status(400).json({
          error: "Company limit reached. For creating more companies, please contact the website owners.",
          message: "Company limit reached",
        });
        return;
      }

      const { default: multer } = await import("multer");
      const { default: path } = await import("path");
      const storage = multer.diskStorage({
        destination: (_req: any, _file: any, cb: any) =>
          cb(null, path.join(process.cwd(), "uploads")),
        filename: (_req: any, file: any, cb: any) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      });
      const upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
      }).single("logo");

      upload(req as any, res as any, async (err: any) => {
        if (err) {
          res.status(400).json({ message: "File upload failed" });
          return;
        }
        try {
          const body = req.body as any;
          const { default: mongoose } = await import("mongoose");
          const db = mongoose.connection.db!;
          const now = new Date();
          const doc = {
            tenantId,
            categoryName: body.companyName || "",
            email: body.email || "",
            companyPhone: body.companyPhone || "",
            companyWebsite: body.companyWebsite || "",
            companyAddress: body.companyAddress || "",
            reciptNumber: body.reciptNumber || "",
            gst: body.gst || "",
            isGstBased: body.isGstBased || "No",
            logo: (req as any).file?.filename || "",
            createdAt: now,
            updatedAt: now,
          };
          const result = await db.collection("batchcategories").insertOne(doc);
          res.json({
            _id: result.insertedId.toString(),
            companyName: doc.categoryName,
            ...doc,
            __v: 0,
          });
        } catch (innerErr) {
          logger.error({ err: innerErr }, "Legacy POST /company save failed");
          res.status(500).json({ message: "Error creating company" });
        }
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /company failed");
      res.status(500).json({ message: "Error creating company" });
    }
  });

  // ── Company PUT — FormData with optional logo upload ──
  gateway.put("/company/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ message: "Auth required" });
        return;
      }

      const { default: multer } = await import("multer");
      const { default: path } = await import("path");
      const storage = multer.diskStorage({
        destination: (_req: any, _file: any, cb: any) =>
          cb(null, path.join(process.cwd(), "uploads")),
        filename: (_req: any, file: any, cb: any) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      });
      const upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 },
      }).single("logo");

      upload(req as any, res as any, async (err: any) => {
        if (err) {
          res.status(400).json({ message: "File upload failed" });
          return;
        }
        try {
          const body = req.body as any;
          const { default: mongoose } = await import("mongoose");
          const db = mongoose.connection.db!;
          const id = p(req, "id");
          const update: any = {
            categoryName: body.companyName || body.categoryName,
            email: body.email,
            companyPhone: body.companyPhone,
            companyWebsite: body.companyWebsite,
            companyAddress: body.companyAddress,
            reciptNumber: body.reciptNumber,
            gst: body.gst,
            isGstBased: body.isGstBased,
            updatedAt: new Date(),
          };
          if ((req as any).file?.filename)
            update.logo = (req as any).file.filename;
          // Remove undefined fields
          for (const k of Object.keys(update)) {
            if (update[k] === undefined) delete update[k];
          }
          // Accept both legacy string IDs and ObjectIds
          const orClauses: any[] = [{ _legacyId: id }];
          if (mongoose.Types.ObjectId.isValid(id))
            orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
          await db
            .collection("batchcategories")
            .updateOne({ tenantId, $or: orClauses }, { $set: update });
          const updated = await db
            .collection("batchcategories")
            .findOne({ tenantId, $or: orClauses });
          if (updated) {
            res.json({
              _id: updated._legacyId || updated._id.toString(),
              logo: updated.logo || "",
              companyName: updated.categoryName,
              email: updated.email || "",
              companyPhone: updated.companyPhone || "",
              companyWebsite: updated.companyWebsite || "",
              companyAddress: updated.companyAddress || "",
              reciptNumber: updated.reciptNumber || "",
              gst: updated.gst || "",
              isGstBased: updated.isGstBased || "No",
              updatedAt: updated.updatedAt,
              __v: 0,
            });
          } else {
            res.json({ _id: id });
          }
        } catch (innerErr) {
          logger.error({ err: innerErr }, "Legacy PUT /company/:id failed");
          res.status(500).json({ message: "Error updating company" });
        }
      });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /company/:id failed");
      res.status(500).json({ message: "Error updating company" });
    }
  });

  // ── Company DELETE ──
  gateway.delete("/company/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ message: "Auth required" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const { ObjectId } = await import("mongodb");
      const db = mongoose.connection.db!;
      await db
        .collection("batchcategories")
        .deleteOne({ _id: new ObjectId(p(req, "id")), tenantId });
      res.json({ message: "Company deleted successfully" });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /company/:id failed");
      res.status(500).json({ message: "Error deleting company" });
    }
  });

  // ── RBAC list response transformer ──
  // Old frontend expects: { roleAccessData: [ { role, companyPermissions, studentControlAccess, studentFeesAccess } ] }
  // The DDD layer flattens these into a single `permissions` map, so we query raw MongoDB instead.
  gateway.get("/user-role", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.json({ roleAccessData: [] });
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const docs = await mongoose.connection
        .db!.collection("roleaccesses")
        .find({ tenantId })
        .project({
          _id: 1,
          role: 1,
          companyPermissions: 1,
          studentControlAccess: 1,
          studentFeesAccess: 1,
          isActive: 1,
        })
        .toArray();

      res.json({ roleAccessData: docs });
    } catch (err) {
      logger.error({ err }, "Legacy RBAC query failed");
      res.json({ roleAccessData: [] });
    }
  });

  // ── POST /user-role — upsert role access (legacy field names) ──
  gateway.post("/user-role", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const body = req.body as any;
      const role = body.role;
      if (!role) {
        res.status(400).json({ message: "Role is required" });
        return;
      }

      const updateFields: Record<string, any> = {
        updatedAt: new Date(),
        tenantId,
      };
      if (body.role) updateFields.role = body.role;
      if (body.companyPermissions)
        updateFields.companyPermissions = body.companyPermissions;
      if (body.studentControlAccess)
        updateFields.studentControlAccess = body.studentControlAccess;
      if (body.studentFeesAccess)
        updateFields.studentFeesAccess = body.studentFeesAccess;
      if (body.isActive !== undefined) updateFields.isActive = body.isActive;

      const result = await mongoose.connection
        .db!.collection("roleaccesses")
        .findOneAndUpdate(
          { tenantId, role },
          { $set: updateFields, $setOnInsert: { createdAt: new Date() } },
          { upsert: true, returnDocument: "after" },
        );

      res.json(result);
    } catch (err) {
      logger.error({ err }, "Legacy POST /user-role failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Users list ──
  // ── Receipt approvals (GET /receipt-approval) — populate reciept from fee collections ──
  gateway.get("/receipt-approval", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      const approvals = await db
        .collection("approvals")
        .find({ tenantId })
        .sort({ createdAt: -1 })
        .toArray();
      if (!approvals.length) {
        res.json({ approvalData: [] });
        return;
      }

      // Collect receipt IDs and fetch from both collections
      const receiptIds = approvals
        .map((a) => a.receiptId)
        .filter(Boolean)
        .map(String);
      const receiptOids = receiptIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const [legacyFees, newFees] = await Promise.all([
        receiptOids.length
          ? db
              .collection("coursefees")
              .find({
                $and: [
                  { $or: [{ tenantId }, { tenantId: { $exists: false } }] },
                  {
                    $or: [
                      { _id: { $in: receiptOids } },
                      { _legacyId: { $in: receiptIds } },
                    ],
                  },
                ],
              })
              .toArray()
          : [],
        db
          .collection("feepayments")
          .find({ tenantId, _id: { $in: receiptOids } })
          .toArray(),
      ]);

      const feeMap = new Map<string, any>();
      [...legacyFees, ...newFees].forEach((f) => {
        feeMap.set(f._id.toString(), f);
        if (f._legacyId) feeMap.set(f._legacyId, f);
      });

      const result = approvals.map((a) => {
        const receiptDoc = a.receiptId
          ? feeMap.get(String(a.receiptId)) || null
          : null;
        return {
          _id: a._legacyId || a._id.toString(),
          status: a.status || "Pending",
          check: a.check ?? false,
          // Always include reciept._id so the frontend's getReceiptStatus()
          // can match by ID even when the source fee doc (coursefees) no longer
          // exists — it was dropped during migration but approvals still reference it.
          reciept: receiptDoc
            ? {
                _id: String(a.receiptId),
                amountPaid: Number(receiptDoc.amountPaid) || 0,
                amountDate:
                  receiptDoc.amountDate ||
                  receiptDoc.paymentDate ||
                  receiptDoc.createdAt,
                narration: receiptDoc.narration || "",
                reciptNumber:
                  receiptDoc.reciptNumber || receiptDoc.receiptNumber || "",
                paymentOption: receiptDoc.paymentOption || "",
                studentInfo:
                  receiptDoc.studentInfo || receiptDoc.studentId || null,
              }
            : { _id: String(a.receiptId) },
          companyId: a.companyId
            ? (typeof a.companyId === "object" ? a.companyId : String(a.companyId))
            : null,
          // StudentCourseFee.jsx reads data.studentId?._id — always return as { _id }
          studentId: a.studentId
            ? (typeof a.studentId === "object"
                ? a.studentId
                : { _id: String(a.studentId) })
            : null,
          createdAt: a.createdAt,
        };
      });

      res.json({ approvalData: result });
    } catch (err) {
      logger.error({ err }, "Legacy GET /receipt-approval failed");
      res.json({ approvalData: [] });
    }
  });

  // ── Receipt approval POST — upsert by tenantId + receiptId ──
  gateway.post("/receipt-approval", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const { studentId, companyId, reciept: receiptId, status, check } =
        req.body as any;

      if (!receiptId) {
        res.status(400).json({ error: "reciept is required" });
        return;
      }

      await mongoose.connection.db!.collection("approvals").updateOne(
        { tenantId, receiptId: String(receiptId) },
        {
          $set: {
            tenantId,
            receiptId: String(receiptId),
            studentId: String(studentId || ""),
            companyId: String(companyId || ""),
            status: status || "Pending",
            check: Boolean(check),
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );

      res.json({ success: true, message: "Approval updated" });

      // Fire-and-forget receipt email when approved and emailSuggestionStatus is on
      if (status === "Approved" && studentId && receiptId) {
        const db = mongoose.connection.db!;
        Promise.all([
          import("../email/EmailService.js"),
          db.collection("tenantsettings").findOne(
            { tenantId },
            { projection: { "_legacySettings.emailsuggestions.emailSuggestionStatus": 1 } },
          ),
          db.collection("students").findOne(
            { tenantId, _id: mongoose.Types.ObjectId.isValid(String(studentId))
                ? new mongoose.Types.ObjectId(String(studentId))
                : undefined },
            { projection: { name: 1, email: 1 } },
          ),
          (async () => {
            const rid = String(receiptId);
            const oid = mongoose.Types.ObjectId.isValid(rid)
              ? new mongoose.Types.ObjectId(rid)
              : null;
            const filter = oid
              ? { $or: [{ _id: oid }, { _legacyId: rid }] }
              : { _legacyId: rid };
            return (
              (await db.collection("coursefees").findOne(filter, {
                projection: { amountPaid: 1, reciptNumber: 1, amountDate: 1, paymentOption: 1 },
              })) ||
              (await db.collection("feepayments").findOne(
                { tenantId, ...(oid ? { _id: oid } : { _legacyId: rid }) },
                { projection: { amountPaid: 1, receiptNumber: 1, paymentDate: 1 } },
              ))
            );
          })(),
        ])
          .then(([{ EmailService }, settingsDoc, studentDoc, receiptDoc]) => {
            const emailEnabled =
              settingsDoc?._legacySettings?.emailsuggestions?.emailSuggestionStatus;
            if (!emailEnabled) return;

            const studentEmail = studentDoc?.email || "";
            if (!studentEmail) return;

            const studentName = studentDoc?.name || "Student";
            const amount = receiptDoc?.amountPaid || receiptDoc?.amount || "N/A";
            const receiptNo =
              receiptDoc?.reciptNumber || receiptDoc?.receiptNumber || String(receiptId);
            const paymentDate = receiptDoc?.amountDate || receiptDoc?.paymentDate
              ? new Date(receiptDoc.amountDate || receiptDoc.paymentDate).toLocaleDateString("en-IN")
              : new Date().toLocaleDateString("en-IN");
            const paymentOption = receiptDoc?.paymentOption || "";

            new EmailService()
              .send({
                to: studentEmail,
                tenantId,
                sentBy: "System",
                subject: "Payment Receipt Approved - Flex Academy",
                html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;background:#f8f9fa;color:#333;margin:0;padding:20px}
.container{max-width:600px;margin:0 auto;background:#fff;padding:24px;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,.1)}
h2{color:#28a745}.detail{margin:4px 0}.footer{margin-top:20px;padding-top:16px;border-top:1px solid #ddd;font-size:.9em}</style>
</head><body><div class="container">
<h2>Payment Receipt Approved</h2>
<p>Dear <strong>${studentName}</strong>,</p>
<p>Your payment has been received and approved. Here are the details:</p>
<div class="detail"><strong>Receipt No:</strong> ${receiptNo}</div>
<div class="detail"><strong>Amount Paid:</strong> ₹${amount}</div>
<div class="detail"><strong>Payment Date:</strong> ${paymentDate}</div>
${paymentOption ? `<div class="detail"><strong>Payment Mode:</strong> ${paymentOption}</div>` : ""}
<p style="margin-top:16px">Thank you for your payment.</p>
<div class="footer"><p>Warm regards,</p><p><strong>Flex Academy</strong></p></div>
</div></body></html>`,
              })
              .catch((err: unknown) =>
                logger.error({ err }, "Receipt approval mail failed"),
              );
          })
          .catch((err: unknown) =>
            logger.error({ err }, "Receipt approval mail setup failed"),
          );
      }
    } catch (err) {
      logger.error({ err }, "Legacy POST /receipt-approval failed");
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ── Get user by ID (GET /users/:id) — resolve _legacyId, return legacy field names ──
  gateway.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const user = await mongoose.connection
        .db!.collection("users")
        .findOne({ tenantId, $or: orClauses });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({
        data: {
          id: user._legacyId || user._id.toString(),
          _id: user._legacyId || user._id.toString(),
          fName: user.firstName || user.fName || "",
          lName: user.lastName || user.lName || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "",
        },
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /users/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Update user (PUT or POST /users/:id) — resolve _legacyId, accept legacy field names ──
  // Metronic uses POST /users/:id for updates (not PUT)
  // Skip reserved sub-paths that have their own handlers (auth, verifyToken, etc.)
  const userSubPaths = [
    "auth",
    "verifyToken",
    "requestPassword",
    "verify-otp",
    "resend-otp",
  ];
  gateway.post(
    "/users/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      if (userSubPaths.includes(p(req, "id"))) {
        next();
        return;
      }
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const id = p(req, "id");
        const body = req.body as any;
        const orClauses: any[] = [{ _legacyId: id }];
        if (mongoose.Types.ObjectId.isValid(id))
          orClauses.push({ _id: new mongoose.Types.ObjectId(id) });

        const updateFields: any = { updatedAt: new Date() };
        if (body.fName || body.firstName)
          updateFields.firstName = body.fName || body.firstName;
        if (body.lName || body.lastName)
          updateFields.lastName = body.lName || body.lastName;
        if (body.email) updateFields.email = body.email;
        if (body.phone) updateFields.phone = body.phone;
        if (body.role) updateFields.role = body.role;

        if (body.password) {
          const { default: bcryptjs } = await import("bcryptjs");
          const salt = await bcryptjs.genSalt(10);
          updateFields.passwordHash = await bcryptjs.hash(body.password, salt);
        }

        const result = await mongoose.connection
          .db!.collection("users")
          .findOneAndUpdate(
            { tenantId, $or: orClauses },
            { $set: updateFields },
            { returnDocument: "after" },
          );
        if (!result) {
          res.status(404).json({ message: "User not found" });
          return;
        }
        res.json({
          data: {
            id: result._legacyId || result._id.toString(),
            fName: result.firstName || "",
            lName: result.lastName || "",
            email: result.email || "",
            phone: result.phone || "",
            role: result.role || "",
            message: "User updated successfully",
          },
        });
      } catch (err) {
        logger.error({ err }, "Legacy POST /users/:id (update) failed");
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  gateway.put("/users/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");
      const body = req.body as any;
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });

      const updateFields: any = { updatedAt: new Date() };
      if (body.fName || body.firstName || body.first_name)
        updateFields.firstName =
          body.fName || body.firstName || body.first_name;
      if (body.lName || body.lastName || body.last_name)
        updateFields.lastName = body.lName || body.lastName || body.last_name;
      if (body.email) updateFields.email = body.email;
      if (body.phone) updateFields.phone = body.phone;
      if (body.role) updateFields.role = body.role;

      if (body.password) {
        const { default: bcryptjs } = await import("bcryptjs");
        const salt = await bcryptjs.genSalt(10);
        updateFields.passwordHash = await bcryptjs.hash(body.password, salt);
      }

      const result = await mongoose.connection
        .db!.collection("users")
        .findOneAndUpdate(
          { tenantId, $or: orClauses },
          { $set: updateFields },
          { returnDocument: "after" },
        );
      if (!result) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({
        data: {
          id: result._legacyId || result._id.toString(),
          fName: result.firstName || result.fName || "",
          lName: result.lastName || result.lName || "",
          email: result.email || "",
          phone: result.phone || "",
          role: result.role || "",
          message: "User updated successfully",
        },
      });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /users/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Create user (POST /users) — accepts both legacy and DDD field names ──
  gateway.post("/users", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const { default: bcryptjs } = await import("bcryptjs");
      const db = mongoose.connection.db!;
      const body = req.body as any;

      const email = body.email;
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      // Check duplicate email
      const existing = await db
        .collection("users")
        .findOne({ tenantId, email });
      if (existing) {
        res
          .status(409)
          .json({ message: "User with this email already exists" });
        return;
      }

      const password = body.password || "Default@123";
      const salt = await bcryptjs.genSalt(10);
      const passwordHash = await bcryptjs.hash(password, salt);

      const now = new Date();
      const userDoc: Record<string, unknown> = {
        tenantId,
        email,
        passwordHash,
        firstName: body.firstName || body.fName || body.first_name || "",
        lastName: body.lastName || body.lName || body.last_name || "",
        phone: body.phone || "",
        role: body.role || "Student",
        isActive: true,
        companyIds: Array.isArray(body.companyIds) ? body.companyIds : [],
        telecallerAccess: body.role === "Telecaller" ? (body.telecallerAccess || "own") : "own",
        createdAt: now,
        updatedAt: now,
        // For Trainer role: store the assigned company (use explicit companyId or first from companyIds)
        ...(body.role === "Trainer"
          ? {
              companyId:
                body.companyId ||
                (Array.isArray(body.companyIds) && body.companyIds.length > 0
                  ? body.companyIds[0]
                  : undefined),
            }
          : {}),
      };

      const result = await db.collection("users").insertOne(userDoc);
      res.status(201).json({
        success: true,
        data: {
          id: result.insertedId.toString(),
          email: userDoc.email,
          firstName: userDoc.firstName,
          lastName: userDoc.lastName,
          role: userDoc.role,
          message: "User created successfully",
        },
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /users failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Delete user (DELETE /users/:id) — resolve _legacyId ──
  gateway.delete("/users/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await mongoose.connection
        .db!.collection("users")
        .deleteOne({ tenantId, $or: orClauses });
      if (result.deletedCount === 0) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ data: { message: "User deleted successfully" } });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /users/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Legacy: GET /api/users → { data: [{ id, fName, lName, role, email, phone }], payload: { pagination } }
  gateway.get("/users", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ data: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      const page = parseInt(req.query.page as string) || 1;
      const itemsPerPage = parseInt(req.query.items_per_page as string) || 100;
      const search = (req.query.search as string) || "";
      const skip = (page - 1) * itemsPerPage;

      const query: any = { tenantId, role: { $nin: ["student", "Student"] } };
      if (search) {
        query.$or = [
          { firstName: new RegExp(search, "i") },
          { lastName: new RegExp(search, "i") },
          { fName: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
        ];
      }

      const total = await db.collection("users").countDocuments(query);
      const docs = await db
        .collection("users")
        .find(query)
        .skip(skip)
        .limit(itemsPerPage)
        .toArray();
      const lastPage = Math.max(1, Math.ceil(total / itemsPerPage));

      const users = docs.map((d: any) => ({
        id: d._legacyId || d._id.toString(),
        _id: d._legacyId || d._id.toString(),
        fName: d.firstName || d.fName || "",
        lName: d.lastName || d.lName || "",
        role: d.role || "",
        email: d.email || "",
        phone: d.phone || "",
      }));

      // Laravel-style links: [Previous, 1, 2, ..., N, Next]
      // Frontend's "Last" button reads links.length - 2 as the last page number.
      const links: Array<{ label: string; active: boolean; url: string | null; page: number | null }> = [];
      links.push({
        label: "&laquo; Previous",
        active: false,
        url: page > 1 ? `/?page=${page - 1}` : null,
        page: page > 1 ? page - 1 : null,
      });
      for (let p = 1; p <= lastPage; p++) {
        links.push({
          label: String(p),
          active: p === page,
          url: `/?page=${p}`,
          page: p,
        });
      }
      links.push({
        label: "Next &raquo;",
        active: false,
        url: page < lastPage ? `/?page=${page + 1}` : null,
        page: page < lastPage ? page + 1 : null,
      });

      res.json({
        data: users,
        payload: {
          pagination: {
            page,
            first_page_url: "/?page=1",
            from: skip + 1,
            last_page: lastPage,
            next_page_url: page < lastPage ? `/?page=${page + 1}` : null,
            items_per_page: itemsPerPage,
            to: skip + docs.length,
            total,
            links,
          },
        },
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /users failed");
      res.json({ data: [] });
    }
  });

  // ── Email Remainder: GET text templates (before/after overdue) ──
  // Legacy: GET /api/emailRemainder → plain array [{ _id, firstRemainder, thirdRemainder }]
  gateway.get("/emailRemainder", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const settings = await mongoose.connection
        .db!.collection("tenantsettings")
        .findOne({ tenantId });
      const legacy = settings?._legacySettings?.emailremainders;
      if (legacy) {
        res.json([
          {
            _id: legacy._id || "default",
            firstRemainder: legacy.firstRemainder || "",
            thirdRemainder: legacy.thirdRemainder || "",
            createdAt: legacy.createdAt,
            updatedAt: legacy.updatedAt,
            __v: 0,
          },
        ]);
      } else {
        res.json([]);
      }
    } catch (err) {
      logger.error({ err }, "Legacy GET /emailRemainder failed");
      res.json([]);
    }
  });

  // ── Email Remainder: POST text templates ──
  gateway.post("/emailRemainder", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const { firstRemainder, thirdRemainder } = req.body as any;
      await mongoose.connection.db!.collection("tenantsettings").updateOne(
        { tenantId },
        {
          $set: {
            "_legacySettings.emailremainders.firstRemainder":
              firstRemainder || "",
            "_legacySettings.emailremainders.thirdRemainder":
              thirdRemainder || "",
            "_legacySettings.emailremainders.updatedAt":
              new Date().toISOString(),
          },
        },
      );
      res.json({ message: "Email Remainder Added" });
    } catch (err) {
      logger.error({ err }, "Legacy POST /emailRemainder failed");
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ── Roll Number Format: GET configured prefix ──
  // Returns { prefix, preview }. Prefix is the custom text (e.g. "OSC") prepended to
  // new roll numbers as PREFIX/FY-START-YEAR/NUMBER. Empty prefix = legacy plain numbers.
  gateway.get("/rollnumber-format", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ prefix: "", preview: "" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const counter = await mongoose.connection
        .db!.collection("rollnumbercounters")
        .findOne({ tenantId });
      const prefix = (counter?.prefix || "").trim();
      res.json({
        prefix,
        preview: formatRollNumber(prefix, 1000, new Date()),
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /rollnumber-format failed");
      res.json({ prefix: "", preview: "" });
    }
  });

  // ── Roll Number Format: POST/save prefix ──
  gateway.post("/rollnumber-format", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      // Allow letters, digits, space, hyphen and underscore; cap length. Strips
      // slashes so the PREFIX/YEAR/NUMBER structure stays unambiguous.
      const raw = String((req.body as any)?.prefix ?? "");
      const prefix = raw.replace(/[^A-Za-z0-9 _-]/g, "").trim().slice(0, 20);
      const { default: mongoose } = await import("mongoose");
      await mongoose.connection
        .db!.collection("rollnumbercounters")
        .updateOne(
          { tenantId },
          { $set: { prefix, updatedAt: new Date() } },
          { upsert: true },
        );
      res.json({
        message: "Roll number format saved",
        prefix,
        preview: formatRollNumber(prefix, 1000, new Date()),
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /rollnumber-format failed");
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ── Email Remainder: GET due dates ──
  // Legacy: GET /api/emailRemainder/remainder-dates → plain array [{ _id, firstDueDay, secondDueDay, thirdDueDay }]
  gateway.get(
    "/emailRemainder/remainder-dates",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const settings = await mongoose.connection
          .db!.collection("tenantsettings")
          .findOne({ tenantId });
        const legacy = settings?._legacySettings?.["remainder-dates"];
        if (legacy) {
          res.json([
            {
              _id: legacy._id || "default",
              firstDueDay: legacy.firstDueDay ?? 0,
              secondDueDay: legacy.secondDueDay ?? 0,
              thirdDueDay: legacy.thirdDueDay ?? 0,
              __v: 0,
            },
          ]);
        } else {
          res.json([]);
        }
      } catch (err) {
        logger.error(
          { err },
          "Legacy GET /emailRemainder/remainder-dates failed",
        );
        res.json([]);
      }
    },
  );

  // ── Email Remainder: POST due dates ──
  gateway.post(
    "/emailRemainder/remainder-dates",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const { firstDueDay, secondDueDay, thirdDueDay } = req.body as any;
        await mongoose.connection.db!.collection("tenantsettings").updateOne(
          { tenantId },
          {
            $set: {
              "_legacySettings.remainder-dates.firstDueDay": firstDueDay,
              "_legacySettings.remainder-dates.secondDueDay": secondDueDay,
              "_legacySettings.remainder-dates.thirdDueDay": thirdDueDay,
            },
          },
        );
        res.json({ message: "Email Remainder Date Added !!" });
      } catch (err) {
        logger.error(
          { err },
          "Legacy POST /emailRemainder/remainder-dates failed",
        );
        res.status(500).json({ error: "Internal error" });
      }
    },
  );

  // ── Email Suggestion status ──
  // Legacy: GET /api/emailRemainder/status → { emailSuggestions: [{ _id, emailSuggestionStatus }] }
  gateway.get("/emailRemainder/status", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ emailSuggestions: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const settings = await mongoose.connection
        .db!.collection("tenantsettings")
        .findOne({ tenantId });
      const legacy = settings?._legacySettings?.emailsuggestions;
      if (legacy) {
        res.json({
          emailSuggestions: [
            {
              _id: legacy._id || "default",
              emailSuggestionStatus: legacy.emailSuggestionStatus ?? false,
            },
          ],
        });
      } else {
        res.json({ emailSuggestions: [] });
      }
    } catch (err) {
      logger.error({ err }, "Legacy GET /emailRemainder/status failed");
      res.json({ emailSuggestions: [] });
    }
  });

  // ── Email Suggestion POST status ──
  gateway.post(
    "/emailRemainder/status",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const { emailSuggestionStatus } = req.body as any;
        await mongoose.connection.db!.collection("tenantsettings").updateOne(
          { tenantId },
          {
            $set: {
              "_legacySettings.emailsuggestions.emailSuggestionStatus":
                emailSuggestionStatus,
            },
          },
        );
        res.json({ message: "Email Suggestion Added" });
      } catch (err) {
        logger.error({ err }, "Legacy POST /emailRemainder/status failed");
        res.status(500).json({ error: "Internal error" });
      }
    },
  );

  // ── Welcome Email status ──
  // Legacy: GET /api/emailRemainder/welcome/status → { emailSuggestions: [{ _id, welcomeemailsuggestion }] }
  gateway.get(
    "/emailRemainder/welcome/status",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json({ emailSuggestions: [] });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const settings = await mongoose.connection
          .db!.collection("tenantsettings")
          .findOne({ tenantId });
        const legacy = settings?._legacySettings?.welcomeemails;
        if (legacy) {
          res.json({
            emailSuggestions: [
              {
                _id: legacy._id || "default",
                welcomeemailsuggestion: legacy.welcomeemailsuggestion ?? false,
              },
            ],
          });
        } else {
          res.json({ emailSuggestions: [] });
        }
      } catch (err) {
        logger.error(
          { err },
          "Legacy GET /emailRemainder/welcome/status failed",
        );
        res.json({ emailSuggestions: [] });
      }
    },
  );

  // ── Welcome Email POST status ──
  gateway.post(
    "/emailRemainder/welcome/status",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const { welcomeemailsuggestion } = req.body as any;
        await mongoose.connection.db!.collection("tenantsettings").updateOne(
          { tenantId },
          {
            $set: {
              "_legacySettings.welcomeemails.welcomeemailsuggestion":
                welcomeemailsuggestion,
            },
          },
        );
        res.json({ message: "Email Suggestion Added" });
      } catch (err) {
        logger.error(
          { err },
          "Legacy POST /emailRemainder/welcome/status failed",
        );
        res.status(500).json({ error: "Internal error" });
      }
    },
  );

  // ── Late Fees status ──
  // Legacy: GET /api/emailRemainder/late-fees/status → { lateFeesSuggestion: [{ _id, lateFees }] }
  gateway.get(
    "/emailRemainder/late-fees/status",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json({ lateFeesSuggestion: [] });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const settings = await mongoose.connection
          .db!.collection("tenantsettings")
          .findOne({ tenantId });
        const legacy = settings?._legacySettings?.latefees;
        if (legacy) {
          res.json({
            lateFeesSuggestion: [
              {
                _id: legacy._id || "default",
                lateFees: legacy.lateFees ?? false,
              },
            ],
          });
        } else {
          res.json({ lateFeesSuggestion: [] });
        }
      } catch (err) {
        logger.error(
          { err },
          "Legacy GET /emailRemainder/late-fees/status failed",
        );
        res.json({ lateFeesSuggestion: [] });
      }
    },
  );

  // ── Late Fees POST status ──
  gateway.post(
    "/emailRemainder/late-fees/status",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const { lateFees } = req.body as any;
        await mongoose.connection
          .db!.collection("tenantsettings")
          .updateOne(
            { tenantId },
            { $set: { "_legacySettings.latefees.lateFees": lateFees } },
          );
        res.json({ message: "Email Suggestion Added" });
      } catch (err) {
        logger.error(
          { err },
          "Legacy POST /emailRemainder/late-fees/status failed",
        );
        res.status(500).json({ error: "Internal error" });
      }
    },
  );

  // ── Email Templates list ──
  // Legacy expects plain array: [{ _id, customTemplate, cancellationTemplate, dynamicTemplate, ... }]
  // ── All email logs (no auth required — legacy frontend fetches without token) ──
  gateway.get("/allMails", async (req: Request, res: Response) => {
    try {
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const tenantId = (req as any).tenantContext?.tenantId;
      const query =
        tenantId && tenantId !== "__unauthenticated__"
          ? { $or: [{ tenantId }, { tenantId: { $exists: false } }] }
          : {};
      const docs = await db
        .collection("emaillogs")
        .find(query)
        .sort({ sentAt: -1 })
        .toArray();
      logger.debug(
        { tenantId, docCount: docs.length, sample: docs[0] },
        "Legacy GET /allMails result",
      );
      res.json(
        docs.map((d: any) => ({
          _id: d._legacyId || d._id.toString(),
          recipientEmails: d.recipientEmails || d.recipients || [],
          subject: d.subject || "",
          content: d.content || "",
          sentAt: d.sentAt || d.createdAt,
          sendedBy: d.sendedBy || d.sender || "",
        })),
      );
    } catch (err) {
      logger.error({ err }, "Legacy GET /allMails failed");
      res.json([]);
    }
  });

  gateway.get("/email/allTemplates", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const docs = await mongoose.connection
        .db!.collection("emailtemplates")
        .find({ tenantId })
        .toArray();
      res.json(
        docs.map((d: any) => ({
          _id: d._legacyId || d._id.toString(),
          customTemplate: d.customTemplate || "",
          cancellationTemplate: d.cancellationTemplate || "",
          dynamicTemplate: d.dynamicTemplate || "",
          courseSubjectTemplate: d.courseSubjectTemplate || "",
          courseChangeTemplate: d.courseChangeTemplate || "",
          createdBy: d.createdBy || "",
          createdAt: d.createdAt,
          updatedAt: d.updatedAt || d.createdAt,
          __v: 0,
        })),
      );
    } catch (err) {
      logger.error({ err }, "Legacy GET /email/allTemplates failed");
      res.json([]);
    }
  });

  // ── Send a custom email template to a student ──
  // POST /api/email-templates/send-to-student
  // Body: { templateName, studentId, preview? }
  // Resolves the student's email + variables, compiles the chosen custom template,
  // and either returns a preview (preview:true) or sends it via SMTP.
  // Custom templates live in `customemailtemplates` (isolated from the fixed
  // `emailtemplates` over-due/cancellation templates, which are never touched).
  gateway.post("/email-templates/send-to-student", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const templateName = String(req.body.templateName || "").trim();
      const studentId = String(req.body.studentId || "").trim();
      const preview = req.body.preview === true || req.body.preview === "true";
      if (!templateName || !studentId) {
        res.status(400).json({ success: false, message: "templateName and studentId are required" });
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      const template = await db
        .collection("customemailtemplates")
        .findOne({ tenantId, templateName });
      if (!template) {
        res.status(404).json({ success: false, message: "Email template not found" });
        return;
      }

      // Resolve the student (by Mongo _id or legacy id)
      const studentOr: any[] = [{ _legacyId: studentId }];
      if (mongoose.Types.ObjectId.isValid(studentId))
        studentOr.unshift({ _id: new mongoose.Types.ObjectId(studentId) });
      const student = await db.collection("students").findOne({ tenantId, $or: studentOr });
      if (!student) {
        res.status(404).json({ success: false, message: "Student not found" });
        return;
      }

      const studentName =
        student.name ||
        [student.firstName, student.lastName].filter(Boolean).join(" ").trim() ||
        "Student";
      const studentEmail = String(student.email || student.studentEmail || "").trim();
      const courseName = String(student.select_course || student.course || student.courseName || "").trim();

      // Resolve the company/institute display name from the student's company id
      let companyName = "";
      const companyRef = student.companyName || student.companyId;
      if (companyRef) {
        const compOr: any[] = [{ _legacyId: String(companyRef) }];
        if (mongoose.Types.ObjectId.isValid(String(companyRef)))
          compOr.unshift({ _id: new mongoose.Types.ObjectId(String(companyRef)) });
        const comp = await db.collection("batchcategories").findOne({ tenantId, $or: compOr });
        companyName = String(comp?.categoryName || comp?.companyName || companyRef || "").trim();
      }

      const variables = { studentName, studentEmail, courseName, companyName };
      const compiledSubject = TemplateEngine.compile(template.subject || "", variables);
      const compiledBody = TemplateEngine.compile(template.body || "", variables);

      if (preview) {
        res.json({
          success: true,
          preview: { to: studentEmail, subject: compiledSubject, body: compiledBody },
        });
        return;
      }

      if (!studentEmail) {
        res.status(400).json({ success: false, message: "This student has no email address on file" });
        return;
      }

      const userId = (req as any).user?.userId;
      const sentBy =
        [(req as any).user?.firstName, (req as any).user?.lastName].filter(Boolean).join(" ") ||
        undefined;

      const ok = await emailService.send({
        to: studentEmail,
        subject: compiledSubject,
        text: compiledBody,
        html: compiledBody.replace(/\n/g, "<br>"),
        tenantId,
        sentBy: sentBy || userId,
      });
      if (!ok) {
        res.status(502).json({ success: false, message: "Email could not be sent (check SMTP settings)" });
        return;
      }
      res.json({ success: true, message: "Email sent to " + studentEmail });
    } catch (err) {
      logger.error({ err }, "send-to-student failed");
      res.status(500).json({ success: false, message: (err as any)?.message || "Failed to send email" });
    }
  });

  // ── Payment Options list ──
  // Legacy expects plain array: [{ _id, name, createdBy, date, createdAt, updatedAt }]
  // DDD collection field: optionName → legacy field: name
  gateway.get("/paymentOptions", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const docs = await db.collection("paymentoptions").find({ tenantId }).toArray();

      const userNameMap = await resolveUserNames(db, docs.map((d: any) => d.createdBy));

      res.json(
        docs.map((d: any) => ({
          _id: d._legacyId || d._id.toString(),
          name: d.optionName || d.name || "",
          createdBy: (d.createdBy && userNameMap.get(d.createdBy)) || d.createdBy || "",
          date: d.createdAt,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt || d.createdAt,
          __v: 0,
        })),
      );
    } catch (err) {
      logger.error({ err }, "Legacy GET /paymentOptions failed");
      res.json([]);
    }
  });

  // ── Course Types list ──
  // Legacy expects plain array: [{ _id, courseType, user, createdBy, createdAt, updatedAt }]
  gateway.get("/courses/courseType", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const docs = await db
        .collection("coursetypes")
        .find({ tenantId })
        .toArray();
      const userNameMap = await resolveUserNames(
        db,
        docs.map((d: any) => d.createdBy),
      );
      res.json(
        docs.map((d: any) => ({
          _id: d._legacyId || d._id.toString(),
          courseType: d.typeName || d.name || d.courseType || "",
          createdBy: userNameMap.get(d.createdBy) || d.createdBy || "",
          createdAt: d.createdAt,
          updatedAt: d.updatedAt || d.createdAt,
          __v: 0,
        })),
      );
    } catch (err) {
      logger.error({ err }, "Legacy GET /courses/courseType failed");
      res.json([]);
    }
  });

  // ── Course Categories list ──
  // Legacy expects plain array: [{ _id, category, user, createdBy, createdAt, updatedAt }]
  gateway.get("/courses/categories", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const docs = await db
        .collection("categories")
        .find({ tenantId })
        .toArray();
      const userNameMap = await resolveUserNames(
        db,
        docs.map((d: any) => d.createdBy),
      );

      res.json(
        docs.map((d: any) => ({
          _id: d._legacyId || d._id.toString(),
          category: d.name || d.category || "",
          createdBy: userNameMap.get(d.createdBy) || d.createdBy || "",
          createdAt: d.createdAt,
          updatedAt: d.updatedAt || d.createdAt,
          __v: 0,
        })),
      );
    } catch (err) {
      logger.error({ err }, "Legacy GET /courses/categories failed");
      res.json([]);
    }
  });

  // ── Number of Years list ──
  // Legacy expects plain array: [{ _id, numberOfYears, user, createdBy, createdAt, updatedAt }]
  gateway.get("/courses/numberOfYears", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const docs = await db
        .collection("numberofyears")
        .find({ tenantId })
        .toArray();
      const userNameMap = await resolveUserNames(
        db,
        docs.map((d: any) => d.createdBy),
      );
      res.json(
        docs.map((d: any) => ({
          _id: d._legacyId || d._id.toString(),
          numberOfYears: Number(d.yearName || d.value || d.numberOfYears || 0),
          createdBy: userNameMap.get(d.createdBy) || d.createdBy || "",
          createdAt: d.createdAt,
          updatedAt: d.updatedAt || d.createdAt,
          __v: 0,
        })),
      );
    } catch (err) {
      logger.error({ err }, "Legacy GET /courses/numberOfYears failed");
      res.json([]);
    }
  });

  // ── Course Type by ID ──
  gateway.get(
    "/courses/courseType/:id",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId) {
          res.json({ _id: p(req, "id"), courseType: "", __v: 0 });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const id = p(req, "id");
        const orClauses: any[] = [{ _legacyId: id }];
        if (mongoose.Types.ObjectId.isValid(id))
          orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
        const d = await mongoose.connection
          .db!.collection("coursetypes")
          .findOne({ tenantId, $or: orClauses });
        if (!d) {
          res.json({ _id: id, courseType: id, createdBy: "", __v: 0 });
          return;
        }
        res.json({
          _id: d._legacyId || d._id.toString(),
          courseType: d.typeName || d.name || "",
          createdBy: d.createdBy || "",
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          __v: 0,
        });
      } catch (err) {
        logger.error({ err }, "Legacy GET /courses/courseType/:id failed");
        res.json({ _id: p(req, "id"), courseType: "", __v: 0 });
      }
    },
  );

  // ── Course Category by ID ──
  gateway.get("/courses/category/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const d = await mongoose.connection
        .db!.collection("categories")
        .findOne({ tenantId, $or: orClauses });
      if (!d) {
        res.json({ _id: id, category: id, createdBy: "", __v: 0 });
        return;
      }
      res.json({
        _id: d._legacyId || d._id.toString(),
        category: d.name || d.category || "",
        createdBy: d.createdBy || "",
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        __v: 0,
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /courses/category/:id failed");
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ── Number of Years by ID ──
  gateway.get(
    "/courses/numberOfYears/:id",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId) {
          res.json({ _id: p(req, "id"), numberOfYears: 0, __v: 0 });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const id = p(req, "id");
        const orClauses: any[] = [{ _legacyId: id }];
        if (mongoose.Types.ObjectId.isValid(id))
          orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
        const d = await mongoose.connection
          .db!.collection("numberofyears")
          .findOne({ tenantId, $or: orClauses });
        if (!d) {
          res.json({ _id: id, numberOfYears: 0, createdBy: "", __v: 0 });
          return;
        }
        res.json({
          _id: d._legacyId || d._id.toString(),
          numberOfYears: Number(d.yearName || d.value || d.numberOfYears || 0),
          createdBy: d.createdBy || "",
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          __v: 0,
        });
      } catch (err) {
        logger.error({ err }, "Legacy GET /courses/numberOfYears/:id failed");
        res.json({ _id: p(req, "id"), numberOfYears: 0, __v: 0 });
      }
    },
  );

  // ── POST /courses — direct MongoDB insert (preserves companyId for company-wise courses) ──
  gateway.post(
    "/courses",
    async (req: Request, res: Response) => {
      try {
        const body = req.body as any;
        const tenantId = (req as any).tenantContext?.tenantId;
        const userId = (req as any).user?.userId;
        if (!tenantId) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;

        // Resolve numberOfYears _id → actual numeric value
        let durationYears = Number(body.durationYears || body.numberOfYears || 1);
        if (isNaN(durationYears) || durationYears < 1) {
          const refId = body.numberOfYears || body.durationYears;
          if (refId) {
            try {
              const { ObjectId } = await import("mongodb");
              const doc =
                (await db.collection("numberofyears").findOne({ tenantId, _id: new ObjectId(refId) })) ||
                (await db.collection("numberofyears").findOne({ tenantId, _legacyId: refId }));
              if (doc) durationYears = Number(doc.value || doc.numberOfYears || 1);
            } catch { /* keep default */ }
          }
          if (isNaN(durationYears) || durationYears < 1) durationYears = 1;
        }

        const now = new Date();
        const doc: Record<string, unknown> = {
          tenantId,
          name: body.courseName || body.name || "",
          courseName: body.courseName || body.name || "",
          fees: Number(body.courseFees ?? body.fees ?? 0),
          courseFees: Number(body.courseFees ?? body.fees ?? 0),
          courseType: body.courseType || "",
          durationYears,
          numberOfYears: durationYears,
          category: body.category || "",
          subjects: body.subjects || [],
          isActive: true,
          createdBy: userId || "system",
          createdAt: now,
          updatedAt: now,
        };
        // Only store companyId when a real value is provided — omitting it marks the
        // course as "shared/legacy" (visible to all companies).
        if (body.companyId) doc.companyId = body.companyId;

        const result = await db.collection("courses").insertOne(doc);
        res.status(201).json({
          _id: result.insertedId.toString(),
          ...doc,
        });
      } catch (err) {
        logger.error({ err }, "Legacy POST /courses failed");
        res.status(500).json({ error: "Internal error" });
      }
    },
  );

  // ── PUT /courses/:id — transform legacy field names + resolve numberOfYears ID ──
  gateway.put(
    "/courses/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body as any;
        const tenantId = (req as any).tenantContext?.tenantId;
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;

        // Resolve numberOfYears _id → actual numeric value (same logic as POST /courses)
        let durationYears = Number(body.durationYears || body.numberOfYears || 0);
        if (isNaN(durationYears) || durationYears < 1) {
          const refId = body.numberOfYears || body.durationYears;
          if (refId) {
            try {
              const { ObjectId } = await import("mongodb");
              const doc =
                (await db
                  .collection("numberofyears")
                  .findOne({ tenantId, _id: new ObjectId(refId) })) ||
                (await db
                  .collection("numberofyears")
                  .findOne({ tenantId, _legacyId: refId }));
              if (doc)
                durationYears = Number(doc.value || doc.numberOfYears || 1);
            } catch {
              /* keep default */
            }
          }
        }

        // Transform body to DDD format; courseType/category stored as reference IDs (resolved by GET handler)
        req.body = {
          name: body.courseName || body.name,
          fees: body.courseFees !== undefined ? Number(body.courseFees) : body.fees !== undefined ? Number(body.fees) : undefined,
          courseType: body.courseType || undefined,
          durationYears: durationYears > 0 ? durationYears : undefined,
          category: body.category || undefined,
          subjects: body.subjects,
          isActive: body.isActive,
          companyId: body.companyId !== undefined ? (body.companyId || null) : undefined,
        };

        // Strip undefined to avoid overwriting existing values with null
        for (const key of Object.keys(req.body)) {
          if ((req.body as any)[key] === undefined) delete (req.body as any)[key];
        }

        // Also patch companyId directly in MongoDB since DDD layer doesn't know it.
        // Only write when a real companyId is provided — never overwrite with null.
        if (body.companyId) {
          const { default: mg2 } = await import("mongoose");
          const { ObjectId } = await import("mongodb");
          const courseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
          const orClauses: any[] = [{ _legacyId: courseId }];
          if (mg2.Types.ObjectId.isValid(courseId))
            orClauses.push({ _id: new ObjectId(courseId) });
          await mg2.connection.db!.collection("courses").updateOne(
            { tenantId, $or: orClauses },
            { $set: { companyId: body.companyId } },
          );
        }

        req.url = `/api/v1/courses/${req.params.id}`;
        req.app._router.handle(req, res, next);
      } catch (err) {
        logger.error({ err }, "Legacy PUT /courses/:id transform failed");
        res.status(500).json({ error: "Internal error" });
      }
    },
  );

  // ── Courses list response transformer ──
  // Prod returns populated objects for courseType, numberOfYears, category, user.
  // DDD returns flat strings. Query raw MongoDB to rebuild the prod format.
  gateway.get("/courses", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      // Filter by companyId when provided — returns company-specific + courses with no company
      const rawCompanyId = req.query.companyId as string | undefined;
      const courseFilter: Record<string, unknown> = { tenantId };
      if (rawCompanyId) {
        // Only show: courses belonging to this company OR legacy shared courses
        // (those that have NO companyId field at all — truly old data before company-scoping).
        // Courses stored with companyId=null or "" are treated as company-owned by nobody,
        // NOT as shared — so they are excluded from other companies.
        courseFilter.$or = [
          { companyId: rawCompanyId },
          { companyId: { $exists: false } },
        ];
      }

      // Load lookup tables
      const [courses, courseTypes, numYears, categories] = await Promise.all([
        db.collection("courses").find(courseFilter).toArray(),
        db.collection("coursetypes").find({ tenantId }).toArray(),
        db.collection("numberofyears").find({ tenantId }).toArray(),
        db.collection("categories").find({ tenantId }).toArray(),
      ]);

      // Build lookup maps by multiple keys (name, _id, _legacyId) for both legacy and DDD docs
      const ctMap = new Map<string, any>();
      for (const ct of courseTypes) {
        if (ct.typeName) ctMap.set(ct.typeName, ct);
        if (ct.name) ctMap.set(ct.name, ct);
        if (ct.courseType) ctMap.set(ct.courseType, ct);
        ctMap.set(ct._id.toString(), ct);
        if (ct._legacyId) ctMap.set(ct._legacyId, ct);
      }
      const nyMap = new Map<string, any>();
      for (const n of numYears) {
        if (n.yearName != null) nyMap.set(String(n.yearName), n);
        if (n.value != null) nyMap.set(String(n.value), n);
        if (n.numberOfYears != null) nyMap.set(String(n.numberOfYears), n);
        nyMap.set(n._id.toString(), n);
        if (n._legacyId) nyMap.set(n._legacyId, n);
      }
      const catMap = new Map<string, any>();
      for (const cat of categories) {
        if (cat.name) catMap.set(cat.name, cat);
        if (cat.category) catMap.set(cat.category, cat);
        catMap.set(cat._id.toString(), cat);
        if (cat._legacyId) catMap.set(cat._legacyId, cat);
      }

      // Resolve createdBy userIds to names
      const userNameMap = await resolveUserNames(
        db,
        courses.map((c: any) => c.createdBy),
      );

      const result = courses.map((c) => {
        const ct = ctMap.get(c.courseType);
        const ny =
          nyMap.get(String(c.durationYears)) ||
          nyMap.get(String(c.numberOfYears));
        const cat = catMap.get(c.category);

        return {
          _id: c._legacyId || c._id.toString(),
          courseName: c.name || c.courseName || "",
          courseFees: c.fees ?? c.courseFees ?? 0,
          courseType: ct
            ? {
                _id: ct._legacyId || ct._id.toString(),
                courseType: ct.typeName || ct.name || ct.courseType || "",
                createdBy: ct.createdBy || "",
                createdAt: ct.createdAt,
                updatedAt: ct.updatedAt,
              }
            : c.courseType,
          numberOfYears: ny
            ? {
                _id: ny._legacyId || ny._id.toString(),
                numberOfYears: Number(
                  ny.yearName || ny.value || ny.numberOfYears || 0,
                ),
                createdBy: ny.createdBy || "",
                createdAt: ny.createdAt,
                updatedAt: ny.updatedAt,
              }
            : c.durationYears || c.numberOfYears,
          category: cat
            ? {
                _id: cat._legacyId || cat._id.toString(),
                category: cat.name || cat.category || "",
                createdBy: cat.createdBy || "",
                createdAt: cat.createdAt,
                updatedAt: cat.updatedAt,
              }
            : c.category,
          companyId: c.companyId || null,
          createdBy: userNameMap.get(c.createdBy) || c.createdBy || "",
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      });

      res.json(result);
    } catch (err) {
      logger.error({ err }, "Legacy courses query failed");
      res.json([]);
    }
  });

  // ── Forms (add-form) ──
  // Prod: array [{ _id, formName, companyName, fields, createdAt, updatedAt, __v }]
  gateway.get("/add-form", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const [docs, companies] = await Promise.all([
        db.collection("formdefinitions").find({ tenantId }).toArray(),
        db.collection("batchcategories").find({ tenantId }).toArray(),
      ]);

      // Build a map: any raw companyId value → canonical _legacyId||_id.toString()
      // so that forms migrated with old ObjectId companyIds still match the
      // current batchcategory IDs that the frontend compares against (data?._id).
      const companyIdMap = new Map<string, string>();
      companies.forEach((c: any) => {
        const canonical = c._legacyId || c._id.toString();
        companyIdMap.set(c._id.toString(), canonical);
        if (c._legacyId) companyIdMap.set(String(c._legacyId), canonical);
      });

      res.json(
        docs.map((d: any) => {
          const rawCompanyId = d.companyId ? String(d.companyId) : null;
          const resolvedCompanyId = rawCompanyId
            ? (companyIdMap.get(rawCompanyId) || rawCompanyId)
            : null;
          return {
            _id: d._legacyId || d._id.toString(),
            formName: d.formName,
            companyName: resolvedCompanyId,
            fields: d.fields || [],
            createdAt: d.createdAt,
            updatedAt: d.updatedAt || d.createdAt,
            __v: 0,
          };
        }),
      );
    } catch (err) {
      logger.error({ err }, "Legacy add-form query failed");
      res.json([]);
    }
  });

  // ── Forms (add-form) POST/GET/:id/PUT/:id/DELETE/:id ──
  gateway.post("/add-form", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const body = req.body as any;
      const doc = {
        tenantId,
        formName: body.formName || body.name || "",
        companyId: body.companyName || body.companyId || null,
        fields: body.fields || [],
        isActive: true,
        createdBy: (req as any).user?.name || "User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const result = await db.collection("formdefinitions").insertOne(doc);
      res.json({
        success: true,
        _id: result.insertedId.toString(),
        formName: doc.formName,
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /add-form failed");
      res.status(500).json({ success: false, error: (err as any).message });
    }
  });

  gateway.get("/add-form/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(404).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const doc = await db
        .collection("formdefinitions")
        .findOne({ tenantId, $or: orClauses });
      if (!doc) {
        res.status(404).json({ success: false, message: "Form not found" });
        return;
      }

      // Populate fields from customfields collection
      const fieldIds = (doc.fields || []).map((f: any) => String(f));
      let populatedFields: any[] = [];
      if (fieldIds.length) {
        const fOr: any[] = [];
        fieldIds.forEach((fid: string) => {
          fOr.push({ _legacyId: fid });
          if (mongoose.Types.ObjectId.isValid(fid))
            fOr.push({ _id: new mongoose.Types.ObjectId(fid) });
        });
        const fDocs = await db
          .collection("customfields")
          .find({ tenantId, $or: fOr })
          .toArray();
        populatedFields = fDocs.map((f: any) => ({
          _id: f._legacyId || f._id.toString(),
          type: f.fieldType || f.type || "text",
          name: f.fieldName || f.name,
          value: f.defaultValue || f.value || "",
          mandatory: f.isMandatory ?? f.mandatory ?? false,
          options: f.options || [],
        }));
      }

      res.json({
        _id: doc._legacyId || doc._id.toString(),
        formName: doc.formName,
        companyName: doc.companyId || null,
        fields: populatedFields,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt || doc.createdAt,
        __v: 0,
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /add-form/:id failed");
      res.status(500).json({ success: false });
    }
  });

  gateway.put("/add-form/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");
      const body = req.body as any;
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const doc = await db
        .collection("formdefinitions")
        .findOne({ tenantId, $or: orClauses });
      if (!doc) {
        res.status(404).json({ success: false, message: "Form not found" });
        return;
      }
      const update: any = { updatedAt: new Date().toISOString() };
      if (body.formName) update.formName = body.formName;
      if (body.companyName || body.companyId)
        update.companyId = body.companyName || body.companyId;
      if (body.fields) update.fields = body.fields;
      await db
        .collection("formdefinitions")
        .updateOne({ _id: doc._id }, { $set: update });
      res.json({ success: true, message: "Form updated" });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /add-form/:id failed");
      res.status(500).json({ success: false });
    }
  });

  gateway.delete("/add-form/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await db
        .collection("formdefinitions")
        .deleteOne({ tenantId, $or: orClauses });
      if (result.deletedCount === 0) {
        res.status(404).json({ success: false, message: "Form not found" });
        return;
      }
      res.json({ success: true, message: "Form deleted" });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /add-form/:id failed");
      res.status(500).json({ success: false });
    }
  });

  // ── Custom Fields ──
  // Prod: array [{ _id, type, name, value, mandatory, quickCreate, headerView, keyField, options, formId, createdAt, updatedAt, __v }]
  // options on prod are [{label, value, _id}] objects
  gateway.get("/custom-field", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      const authHdr = (req.headers.authorization as string) || "";
      if (authHdr === "Bearer undefined" || authHdr === "Bearer null" || authHdr === "Bearer") {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED" } });
        return;
      }
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const docs = await mongoose.connection
        .db!.collection("customfields")
        .find({ tenantId })
        .sort({ order: 1, createdAt: 1 })
        .toArray();
      res.json(
        docs.map((d: any) => {
          // Normalise formId to an array of strings — the frontend accesses
          // formId[formId.length - 1] so we must guarantee a non-empty array.
          let rawFormId = d.formIds || d.formId;
          let formIdArr: string[];
          if (Array.isArray(rawFormId)) {
            formIdArr = rawFormId.map(String).filter(Boolean);
          } else if (rawFormId) {
            formIdArr = [String(rawFormId)];
          } else {
            formIdArr = [];
          }
          return {
            _id: d._legacyId || d._id.toString(),
            type: d.fieldType || d.type || "text",
            name: d.fieldName || d.name,
            value: d.defaultValue || d.value || "",
            mandatory: d.isMandatory ?? d.mandatory ?? false,
            quickCreate: d.isQuickCreate ?? d.quickCreate ?? false,
            headerView: d.isHeaderView ?? d.headerView ?? false,
            keyField: d.isKeyField ?? d.keyField ?? false,
            options: d.options || [],
            formId: formIdArr,
            companyName: d.companyId || null,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt || d.createdAt,
            __v: 0,
          };
        }),
      );
    } catch (err) {
      logger.error({ err }, "Legacy custom-field query failed");
      res.json([]);
    }
  });

  // ── Reorder custom fields ──
  // Body: { ids: [orderedFieldId, ...] }. Persists the display order by setting
  // `order` = position for each field. Used by the Custom Fields manager's
  // up/down controls; honoured by both read paths (GET /custom-field and the DDD
  // /api/v1/custom-fields list, which sort by { order, createdAt }).
  gateway.post("/custom-field/reorder", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const ids: string[] = Array.isArray((req.body as any)?.ids)
        ? (req.body as any).ids.map(String)
        : [];
      if (!ids.length) {
        res.status(400).json({ success: false, message: "ids array is required" });
        return;
      }
      await Promise.all(
        ids.map((id, index) => {
          const or: any[] = [{ _legacyId: id }];
          if (mongoose.Types.ObjectId.isValid(id))
            or.push({ _id: new mongoose.Types.ObjectId(id) });
          return db
            .collection("customfields")
            .updateOne(
              { tenantId, $or: or },
              { $set: { order: index, updatedAt: new Date() } },
            );
        }),
      );
      res.json({ success: true, message: "Order saved" });
    } catch (err) {
      logger.error({ err }, "Legacy POST /custom-field/reorder failed");
      res.status(500).json({ success: false, message: "Internal error" });
    }
  });

  // ── Custom Field POST/GET/:id/PUT/:id/DELETE/:id ──
  // Legacy sends: { name, type, value, mandatory, options: [{label,value}], formId: [...], companyName }
  // DDD expects: fieldName, fieldType — mismatch, so we handle directly
  gateway.post("/custom-field", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const body = req.body as any;
      const doc = {
        tenantId,
        fieldName: body.name || body.fieldName || "",
        fieldType: body.type || body.fieldType || "text",
        defaultValue: body.value || body.defaultValue || "",
        isMandatory: body.mandatory ?? false,
        isQuickCreate: body.quickCreate ?? false,
        isHeaderView: body.headerView ?? false,
        isKeyField: body.keyField ?? false,
        options: body.options || [],
        formIds: Array.isArray(body.formId) ? body.formId : (body.formId ? [body.formId] : []),
        companyId: body.companyName || body.companyId || null,
        isActive: true,
        createdBy: (req as any).user?.name || "User",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const result = await db.collection("customfields").insertOne(doc);
      res.json({
        success: true,
        _id: result.insertedId.toString(),
        name: doc.fieldName,
        type: doc.fieldType,
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /custom-field failed");
      res.status(500).json({ success: false, error: (err as any).message });
    }
  });

  gateway.get("/custom-field/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(404).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const d = await db
        .collection("customfields")
        .findOne({ tenantId, $or: orClauses });
      if (!d) {
        res.status(404).json({ success: false, message: "Field not found" });
        return;
      }
      res.json({
        _id: d._legacyId || d._id.toString(),
        type: d.fieldType || d.type || "text",
        name: d.fieldName || d.name,
        value: d.defaultValue || d.value || "",
        mandatory: d.isMandatory ?? d.mandatory ?? false,
        quickCreate: d.isQuickCreate ?? false,
        headerView: d.isHeaderView ?? false,
        keyField: d.isKeyField ?? false,
        options: d.options || [],
        formId: d.formIds || d.formId || [],
        companyName: d.companyId || null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        __v: 0,
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /custom-field/:id failed");
      res.status(500).json({ success: false });
    }
  });

  gateway.put("/custom-field/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");
      const body = req.body as any;
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const doc = await db
        .collection("customfields")
        .findOne({ tenantId, $or: orClauses });
      if (!doc) {
        res.status(404).json({ success: false, message: "Field not found" });
        return;
      }
      const update: any = { updatedAt: new Date().toISOString() };
      if (body.name || body.fieldName)
        update.fieldName = body.name || body.fieldName;
      if (body.type || body.fieldType)
        update.fieldType = body.type || body.fieldType;
      if (body.value !== undefined || body.defaultValue !== undefined)
        update.defaultValue = body.value ?? body.defaultValue ?? "";
      if (body.mandatory !== undefined) update.isMandatory = body.mandatory;
      if (body.quickCreate !== undefined)
        update.isQuickCreate = body.quickCreate;
      if (body.headerView !== undefined) update.isHeaderView = body.headerView;
      if (body.keyField !== undefined) update.isKeyField = body.keyField;
      if (body.options) update.options = body.options;
      if (body.formId) update.formIds = body.formId;
      if (body.companyName || body.companyId)
        update.companyId = body.companyName || body.companyId;
      await db
        .collection("customfields")
        .updateOne({ _id: doc._id }, { $set: update });
      res.json({ success: true, message: "Field updated" });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /custom-field/:id failed");
      res.status(500).json({ success: false });
    }
  });

  gateway.delete("/custom-field/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await db
        .collection("customfields")
        .deleteOne({ tenantId, $or: orClauses });
      if (result.deletedCount === 0) {
        res.status(404).json({ success: false, message: "Field not found" });
        return;
      }
      res.json({ success: true, message: "Field deleted" });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /custom-field/:id failed");
      res.status(500).json({ success: false });
    }
  });

  // ── Select Fields (default selects) ──
  // Prod: { success: true, defaultSelects: [{ _id, selectName, options: [{label,value,_id}], mandatory, __v, type }] }
  gateway.get("/select-field", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      // Return 401 when the request arrives before auth is loaded (React sends
      // "Bearer undefined") so React Query marks the query as FAILED rather than
      // caching an empty-defaultSelects result.  On retry (once the real token
      // is available) the query will succeed and hydrate the UI correctly.
      // Truly anonymous requests (no Authorization header at all) still get
      // an empty-but-successful response so the public enquiry form isn't broken.
      const authHeader = (req.headers.authorization as string) || "";
      const isPlaceholderToken =
        authHeader === "Bearer undefined" ||
        authHeader === "Bearer null" ||
        authHeader === "Bearer";
      if (isPlaceholderToken) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth token not ready" } });
        return;
      }
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ success: true, defaultSelects: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const docs = await db.collection("defaultselects").find({ tenantId }).toArray();
      const list = docs.map((d: any) => ({
        _id: d._legacyId || d._id.toString(),
        selectName: d.selectName,
        options: d.options || [],
        mandatory: d.isMandatory ?? d.mandatory ?? false,
        __v: 0,
        type: d.fieldType || d.type || "select",
      }));

      // On the Add-Enquiry page, append a dynamic "Referred By" select listing that
      // company's Commission DayBook accounts. The company id isn't sent to this
      // endpoint, so derive it from the Referer (/add-enquiry/<companyId>).
      const ref = String(req.headers.referer || "");
      const rm = ref.match(/\/add-enquiry\/([a-f0-9]{24})/i);
      if (rm) {
        const options = await commissionReferrerOptions(db, tenantId, rm[1]);
        list.push({
          _id: "referred-by",
          selectName: "Referred By",
          options,
          mandatory: false,
          __v: 0,
          type: "select",
        });
      }
      res.json({ success: true, defaultSelects: list });
    } catch (err) {
      logger.error({ err }, "Legacy select-field query failed");
      res.json({ success: true, defaultSelects: [] });
    }
  });

  // ── GET /select-field/:id — fetch a single default select by _legacyId or _id ──
  gateway.get("/select-field/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const rawId = p(req, "id");
      const orClauses: any[] = [{ _legacyId: rawId }];
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        orClauses.push({ _id: new mongoose.Types.ObjectId(rawId) });
      }

      const doc = await mongoose.connection
        .db!.collection("defaultselects")
        .findOne({ tenantId, $or: orClauses });

      if (!doc) {
        res.status(404).json({ success: false, message: "Select field not found" });
        return;
      }

      res.json({
        success: true,
        defaultSelect: {
          _id: (doc as any)._legacyId || (doc as any)._id.toString(),
          selectName: (doc as any).selectName,
          options: (doc as any).options || [],
          mandatory: (doc as any).isMandatory ?? (doc as any).mandatory ?? false,
          __v: 0,
          type: (doc as any).fieldType || (doc as any).type || "select",
        },
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /select-field/:id failed");
      res.status(500).json({ success: false, error: (err as any).message });
    }
  });

  // ── PUT /select-field/:id — update a default select by _legacyId or _id ──
  gateway.put("/select-field/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ success: false, message: "Auth required" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const rawId = p(req, "id");
      const orClauses: any[] = [{ _legacyId: rawId }];
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        orClauses.push({ _id: new mongoose.Types.ObjectId(rawId) });
      }

      const body = req.body as any;
      // The mutation sends { id, data: { selectName, options } } as the body wrapper,
      // but some callers send fields at the top level — normalise both shapes.
      const payload = (body.data && typeof body.data === "object") ? body.data : body;
      const updateFields: any = { updatedAt: new Date() };
      if (payload.selectName !== undefined) updateFields.selectName = payload.selectName;
      if (payload.options !== undefined) {
        // Always store as {label, value} objects — the frontend (EditSelectDynamicFields)
        // reads option.label and sends back objects from its local state.
        updateFields.options = (payload.options as any[]).map((o: any) => {
          if (typeof o === "string") {
            return { label: o, value: o.toLowerCase().replace(/\s+/g, "-") };
          }
          return {
            label: o.label || o.value || String(o),
            value: o.value || (o.label || String(o)).toLowerCase().replace(/\s+/g, "-"),
          };
        });
      }
      if (payload.mandatory !== undefined) updateFields.mandatory = payload.mandatory;

      const doc = await mongoose.connection
        .db!.collection("defaultselects")
        .findOneAndUpdate(
          { tenantId, $or: orClauses },
          { $set: updateFields },
          { returnDocument: "after" },
        );

      if (!doc) {
        res.status(404).json({ success: false, message: "Select field not found" });
        return;
      }

      res.json({
        success: true,
        _id: (doc as any)._legacyId || (doc as any)._id.toString(),
        selectName: (doc as any).selectName,
        options: (doc as any).options || [],
        mandatory: (doc as any).isMandatory ?? (doc as any).mandatory ?? false,
        __v: 0,
      });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /select-field/:id failed");
      res.status(500).json({ success: false, error: (err as any).message });
    }
  });

  // ── Submit Form (form submissions) ──
  // Prod: { success: true, formFieldValues: [{ _id, formId, companyId, formFiledValue, addedBy, createdAt, updatedAt, __v }] }
  gateway.get("/submit-form", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ success: true, formFieldValues: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db2 = mongoose.connection.db!;
      const [docs, selectDocs2] = await Promise.all([
        db2.collection("formsubmissions").find({ tenantId }).toArray(),
        db2.collection("defaultselects").find({ tenantId }).toArray(),
      ]);
      const selectNames2 = new Set<string>(
        selectDocs2
          .map((s: any) => s.selectName || s.name || "")
          .filter(Boolean)
          .map((n: string) => n.toLowerCase()),
      );
      res.json({
        success: true,
        formFieldValues: docs.map((d: any) => {
          const rawVals: any[] = d.values || d.formFiledValue || [];
          return {
            _id: d._legacyId || d._id.toString(),
            formId: d.formId,
            companyId: d.companyId,
            formFiledValue: rawVals.map((f: any) =>
              selectNames2.has((f.name || "").toLowerCase()) ? { ...f, type: "select" } : f,
            ),
            addedBy: d.addedBy || "",
            createdAt: d.createdAt,
            updatedAt: d.updatedAt || d.createdAt,
            __v: 0,
          };
        }),
      });
    } catch (err) {
      logger.error({ err }, "Legacy submit-form query failed");
      res.json({ success: true, formFieldValues: [] });
    }
  });

  // ── Submit Form: POST (authenticated, addedBy = user name) ──
  // Legacy: POST /api/submit-form → { formId, companyId, [fieldName]: { newValue, type } }
  gateway.post("/submit-form", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false, error: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const body = req.body as any;
      const formId = body.formId;
      const companyId = body.companyId;

      // Transform: { fieldName: { newValue, type } } → [{ name, type, value }]
      const values = Object.keys(body)
        .filter((key) => key !== "formId" && key !== "companyId" && key !== "0")
        .map((key) => {
          const field = body[key];
          return {
            name: key,
            type: field?.type || "text",
            value: field?.newValue !== undefined ? field.newValue : field,
            mandatory: false,
            options: [],
          };
        });

      // Look up user's actual name from DB
      let userName = "User";
      const userId = (req as any).user?.userId;
      if (userId) {
        const userOrClauses: any[] = [];
        if (mongoose.Types.ObjectId.isValid(userId))
          userOrClauses.push({ _id: new mongoose.Types.ObjectId(userId) });
        userOrClauses.push({ _legacyId: userId });
        const userDoc = await db
          .collection("users")
          .findOne({ tenantId, $or: userOrClauses });
        if (userDoc)
          userName =
            [userDoc.firstName, userDoc.lastName].filter(Boolean).join(" ") ||
            userDoc.fName ||
            userDoc.name ||
            "User";
      }
      const doc = {
        tenantId,
        formId,
        companyId,
        values,
        addedBy: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.collection("formsubmissions").insertOne(doc);

      // Notify the referrer if a "Referred By" person was chosen.
      const valueByName: Record<string, string> = {};
      values.forEach((v: any) => { valueByName[v.name] = String(v.value ?? ""); });
      void sendReferralEmail(db, tenantId, companyId, valueByName);

      res.json({
        success: true,
        message: "Form data and rows updated successfully",
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /submit-form failed");
      res.status(500).json({ success: false, error: (err as any).message });
    }
  });

  // ── Submit Enquiry Form: POST (public, addedBy = "Form") ──
  // Legacy: POST /api/submit-form/enquiry-form → same body format, no auth required
  gateway.post(
    "/submit-form/enquiry-form",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId || "ims_reliance";
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const body = req.body as any;
        const formId = body.formId;
        const companyId = body.companyId;

        // Enforce mandatory enquiry custom fields (managed in the Custom Fields page,
        // scoped per company + formType=enquiry). Values arrive as { fieldName: { newValue } }.
        const enquiryCompanyId = companyId || body.companyName;
        if (enquiryCompanyId && formId) {
          const mandatoryEnquiry = await db
            .collection("customfields")
            .find({
              tenantId,
              companyId: enquiryCompanyId,
              formType: "enquiry",
              formId,
              mandatory: true,
            })
            .toArray();
          for (const def of mandatoryEnquiry) {
            const entry = body[def.fieldName];
            const v = entry && typeof entry === "object" ? entry.newValue : entry;
            if (v === undefined || v === null || String(v).trim() === "") {
              res.status(400).json({ success: false, message: `${def.fieldName} is required` });
              return;
            }
          }
        }

        const values = Object.keys(body)
          .filter(
            (key) => key !== "formId" && key !== "companyId" && key !== "0",
          )
          .map((key) => {
            const field = body[key];
            return {
              name: key,
              type: field?.type || "text",
              value: field?.newValue !== undefined ? field.newValue : field,
              mandatory: false,
              options: [],
            };
          });

        // If user is authenticated, use their real name; otherwise "Form"
        let addedBy = "Form";
        const userId = (req as any).user?.userId;
        if (userId) {
          const userOrClauses: any[] = [];
          if (mongoose.Types.ObjectId.isValid(userId))
            userOrClauses.push({ _id: new mongoose.Types.ObjectId(userId) });
          userOrClauses.push({ _legacyId: userId });
          const userDoc = await db
            .collection("users")
            .findOne({ tenantId, $or: userOrClauses });
          if (userDoc)
            addedBy =
              [userDoc.firstName, userDoc.lastName].filter(Boolean).join(" ") ||
              userDoc.fName ||
              userDoc.name ||
              "Form";
        }

        const doc = {
          tenantId,
          formId,
          companyId,
          values,
          addedBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.collection("formsubmissions").insertOne(doc);
        res.json({
          success: true,
          message: "Form data and rows updated successfully",
        });
      } catch (err) {
        logger.error({ err }, "Legacy POST /submit-form/enquiry-form failed");
        res.status(500).json({ success: false, error: (err as any).message });
      }
    },
  );

  // ── Public Enquiry Form (NO AUTH) ──────────────────────────────────────────────
  // Resolves the tenant from the company/form id in the URL so an enquiry form can be
  // shared as a public link. The standalone page lives at /enquiry/<companyId>/<formId>.

  // Standard fields every enquiry form has (rendered by the public page).
  const STANDARD_ENQUIRY_FIELDS = [
    { name: "Name", type: "text", mandatory: true },
    { name: "Mobile Number", type: "text", mandatory: true },
    { name: "Email", type: "email", mandatory: true },
    { name: "City", type: "text", mandatory: false },
  ];

  // Resolve a public enquiry link. Both params may be a real id (_legacyId/_id) OR a
  // slugified name, so links can be short & readable, e.g.
  //   /enquiry/visual-media-academy/enquiry   (company slug / form slug)
  // Returns the RESOLVED real ids so callers store/query with canonical values.
  async function resolvePublicEnquiry(db: any, mongoose: any, companyParam: string, formParam?: string) {
    const { ObjectId } = mongoose.Types;
    const slugify = (s: any) =>
      String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    // 1) Company — by id first, else by slugified name.
    const compOr: any[] = [{ _legacyId: companyParam }];
    if (ObjectId.isValid(companyParam)) compOr.push({ _id: new ObjectId(companyParam) });
    let comp = await db.collection("batchcategories").findOne({ $or: compOr });
    if (!comp) {
      const target = slugify(companyParam);
      const all = await db.collection("batchcategories").find({}).toArray();
      comp =
        all.find((c: any) => slugify(c.categoryName || c.companyName || c.name) === target) || null;
    }
    if (!comp) return null;
    const tenantId = comp.tenantId;
    const companyId = comp._legacyId ? String(comp._legacyId) : comp._id.toString();
    const companyName = comp.companyName || comp.categoryName || comp.name || "Enquiry";

    // 2) Form within this company — by id, else by slugified name, else the first form.
    let formDoc: any = null;
    if (formParam) {
      const or: any[] = [{ _legacyId: formParam }];
      if (ObjectId.isValid(formParam)) or.push({ _id: new ObjectId(formParam) });
      formDoc = await db.collection("formdefinitions").findOne({ tenantId, companyId, $or: or });
      if (!formDoc) {
        const target = slugify(formParam);
        const forms = await db
          .collection("formdefinitions")
          .find({ tenantId, companyId })
          .toArray();
        formDoc = forms.find((f: any) => slugify(f.formName) === target) || null;
      }
    }
    if (!formDoc) {
      formDoc = await db.collection("formdefinitions").findOne({ tenantId, companyId });
    }
    if (!formDoc) return null;
    const formId = formDoc._legacyId ? String(formDoc._legacyId) : formDoc._id.toString();
    return { tenantId, companyName, companyId, formId, formDoc };
  }

  // Commission DayBook accounts double as "referrers": each can hold an email. This
  // builds the option list for the "Referred By" enquiry-form select, scoped to a
  // company (names de-duplicated).
  async function commissionReferrerOptions(db: any, tenantId: string, companyId?: string): Promise<string[]> {
    if (!companyId) return [];
    const accts = await db
      .collection("daybookaccounts")
      .find({ tenantId, accountType: "Commission", companyId })
      .toArray();
    return Array.from(
      new Set(accts.map((a: any) => String(a.accountName || "").trim()).filter(Boolean)),
    );
  }

  // Mask a mobile number for referral emails: keep the first 2 and last 2 digits.
  function maskMobile(m: any): string {
    const s = String(m || "").trim();
    if (!s) return "";
    if (s.length <= 4) return "X".repeat(s.length);
    return s.slice(0, 2) + "X".repeat(s.length - 4) + s.slice(-2);
  }

  // If an enquiry was submitted with a "Referred By" person, email that person — their
  // email lives on the matching Commission DayBook account. The lead's mobile is
  // partially masked. Fire-and-forget so it never blocks the submission.
  async function sendReferralEmail(
    db: any,
    tenantId: string,
    companyId: string | null | undefined,
    valueByName: Record<string, string>,
    companyName?: string,
  ): Promise<void> {
    try {
      const referrer = String(valueByName["Referred By"] || "").trim();
      if (!referrer) return;
      const acct = await db.collection("daybookaccounts").findOne({
        tenantId,
        accountType: "Commission",
        accountName: referrer,
        ...(companyId ? { companyId } : {}),
      });
      if (!acct || !acct.email) return;
      const name = valueByName["Name"] || "";
      const mobile = maskMobile(valueByName["Mobile Number"]);
      const status = valueByName["Lead Status"] || "";
      const course = valueByName["Course"] || valueByName["select_course"] || "";
      const lines = [
        `Hello ${acct.accountName},`,
        ``,
        `A new enquiry${companyName ? ` at ${companyName}` : ""} has been received with you as the referrer:`,
        ``,
        `Name: ${name}`,
        mobile ? `Mobile: ${mobile}` : "",
        status ? `Lead Status: ${status}` : "",
        course ? `Course: ${course}` : "",
        ``,
        `Thank you for your referral.`,
      ].filter((l) => l !== "");
      const text = lines.join("\n");
      logger.info({ to: acct.email, referrer, companyId }, "Sending referral email");
      void emailService
        .send({
          to: acct.email,
          subject: `New referral enquiry${companyName ? ` — ${companyName}` : ""}`,
          text,
          html: text.replace(/\n/g, "<br>"),
          tenantId,
        })
        .catch((e: any) => logger.error({ err: e }, "Referral email send failed"));
    } catch (err) {
      logger.error({ err }, "sendReferralEmail failed");
    }
  }

  gateway.get(
    ["/public/enquiry/:companyId", "/public/enquiry/:companyId/:formId"],
    async (req: Request, res: Response) => {
      try {
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const companyId = p(req, "companyId");
        const formIdParam = req.params.formId ? p(req, "formId") : undefined;
        const ctx = await resolvePublicEnquiry(db, mongoose, companyId, formIdParam);
        if (!ctx) {
          res.status(404).json({ success: false, message: "Enquiry form not found" });
          return;
        }
        // Use the RESOLVED ids (params may have been slugs).
        const companyResolved = ctx.companyId;
        const selectedFormId = ctx.formId;
        const forms = await db
          .collection("formdefinitions")
          .find({ tenantId: ctx.tenantId, companyId: companyResolved })
          .toArray();
        const formList = forms.map((f: any) => ({
          id: f._legacyId || f._id.toString(),
          name: f.formName || "Enquiry",
        }));

        // Public walk-in enquiry form: some companies lock specific dropdowns to a
        // single default value so customers can only submit walk-in queries. The full
        // option list still exists for staff in the admin views — this only narrows the
        // PUBLIC form. Keyed by companyId.
        const PUBLIC_FORCED_SELECTS: Record<string, Record<string, string>> = {
          "68b9d092d6bc3d1f1b826847": { "Lead Source": "Walk-in", "Lead Status": "Hot" },
        };
        const forcedSelects = PUBLIC_FORCED_SELECTS[companyResolved] || {};

        const ds = await db
          .collection("defaultselects")
          .find({ tenantId: ctx.tenantId })
          .toArray();
        const defaultSelects = ds.map((d: any) => {
          const locked = forcedSelects[d.selectName];
          const allOptions = (d.options || []).map((o: any) =>
            typeof o === "string" ? o : o.value ?? o.label,
          );
          return {
            name: d.selectName,
            type: "select",
            mandatory: d.isMandatory ?? d.mandatory ?? false,
            options: locked ? [locked] : allOptions,
            defaultValue: locked || undefined,
          };
        });

        // Dynamic "Referred By" select — this company's Commission DayBook accounts.
        const referrerOptions = await commissionReferrerOptions(db, ctx.tenantId, companyResolved);
        if (referrerOptions.length) {
          defaultSelects.push({
            name: "Referred By",
            type: "select",
            mandatory: false,
            options: referrerOptions,
            defaultValue: undefined,
          });
        }

        const cfs = await db
          .collection("customfields")
          .find({
            tenantId: ctx.tenantId,
            companyId: companyResolved,
            formType: "enquiry",
            formId: selectedFormId,
          })
          .sort({ order: 1, createdAt: 1 })
          .toArray();
        const customFields = cfs.map((f: any) => ({
          id: f._id.toString(),
          fieldName: f.fieldName,
          fieldType: f.fieldType,
          options: f.options || [],
          mandatory: f.mandatory ?? false,
        }));

        res.json({
          success: true,
          companyId: companyResolved,
          companyName: ctx.companyName,
          forms: formList,
          selectedFormId,
          selectedFormName:
            (formList.find((f: any) => f.id === selectedFormId) || {}).name || "Enquiry",
          standardFields: STANDARD_ENQUIRY_FIELDS,
          defaultSelects,
          customFields,
        });
      } catch (err) {
        logger.error({ err }, "Public GET /public/enquiry failed");
        res.status(500).json({ success: false, message: "Internal error" });
      }
    },
  );

  gateway.post(
    "/public/enquiry/:companyId/:formId",
    async (req: Request, res: Response) => {
      try {
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const ctx = await resolvePublicEnquiry(
          db,
          mongoose,
          p(req, "companyId"),
          p(req, "formId"),
        );
        if (!ctx) {
          res.status(404).json({ success: false, message: "Enquiry form not found" });
          return;
        }
        // Resolved real ids (params may have been slugs).
        const companyId = ctx.companyId;
        const formId = ctx.formId;

        const incoming = Array.isArray((req.body as any)?.fields)
          ? (req.body as any).fields
          : [];
        const valueByName: Record<string, string> = {};
        for (const f of incoming) {
          if (f && typeof f.name === "string") valueByName[f.name] = String(f.value ?? "").trim();
        }

        // Re-derive the required set server-side (don't trust the client).
        const required: string[] = STANDARD_ENQUIRY_FIELDS.filter((f) => f.mandatory).map(
          (f) => f.name,
        );
        const ds = await db
          .collection("defaultselects")
          .find({ tenantId: ctx.tenantId, $or: [{ isMandatory: true }, { mandatory: true }] })
          .toArray();
        ds.forEach((d: any) => required.push(d.selectName));
        const cfs = await db
          .collection("customfields")
          .find({ tenantId: ctx.tenantId, companyId, formType: "enquiry", formId, mandatory: true })
          .toArray();
        cfs.forEach((f: any) => required.push(f.fieldName));

        for (const name of required) {
          if (!valueByName[name]) {
            res.status(400).json({ success: false, message: `${name} is required` });
            return;
          }
        }

        const values = incoming.map((f: any) => ({
          name: f.name,
          type: f.type || "text",
          value: String(f.value ?? ""),
          mandatory: !!f.mandatory,
          options: f.options || [],
        }));

        await db.collection("formsubmissions").insertOne({
          tenantId: ctx.tenantId,
          formId,
          companyId,
          values,
          addedBy: "Form",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Notify the referrer if a "Referred By" person was chosen.
        void sendReferralEmail(db, ctx.tenantId, companyId, valueByName, ctx.companyName);

        res.json({ success: true, message: "Enquiry submitted successfully" });
      } catch (err) {
        logger.error({ err }, "Public POST /public/enquiry failed");
        res.status(500).json({ success: false, message: "Internal error" });
      }
    },
  );

  // ── GET single form submission by ID ──
  gateway.get("/submit-form/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(404).json({ success: false, message: "Not found" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");

      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const doc = await db
        .collection("formsubmissions")
        .findOne({ tenantId, $or: orClauses });
      if (!doc) {
        res
          .status(404)
          .json({ success: false, message: "Form data not found" });
        return;
      }

      // Look up all default select names for this tenant so we can mark those
      // formFiledValue entries with type='select'. Both OnlyViewFormData and
      // UpdateFormData only render text/url/currency/date/number/textarea types as
      // plain inputs — type='select' is skipped, preventing the duplicate row that
      // appears when a select field is rendered as both a text box (from formFiledValue)
      // and a dropdown (from allDefaultSelects).
      const selectDocs = await db
        .collection("defaultselects")
        .find({ tenantId })
        .toArray();
      // Case-insensitive set so "Course" and "course" both match
      const selectNames = new Set<string>(
        selectDocs
          .map((s: any) => s.selectName || s.name || "")
          .filter(Boolean)
          .map((n: string) => n.toLowerCase()),
      );

      const rawValues: any[] = doc.values || doc.formFiledValue || [];
      const formFiledValue = rawValues.map((f: any) =>
        selectNames.size > 0 && selectNames.has((f.name || "").toLowerCase())
          ? { ...f, type: "select" }
          : f,
      );

      res.json({
        _id: doc._legacyId || doc._id.toString(),
        formId: doc.formId,
        companyId: doc.companyId,
        formFiledValue,
        addedBy: doc.addedBy || "",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt || doc.createdAt,
        __v: 0,
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /submit-form/:id failed");
      res.status(500).json({ success: false, message: "Internal error" });
    }
  });

  // ── PUT update form submission ──
  gateway.put("/submit-form/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");
      const body = req.body as any;

      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const doc = await db
        .collection("formsubmissions")
        .findOne({ tenantId, $or: orClauses });
      if (!doc) {
        res
          .status(404)
          .json({ success: false, message: "Form data not found" });
        return;
      }

      const updateFields: any = { updatedAt: new Date().toISOString() };
      if (body.addedBy) updateFields.addedBy = body.addedBy;

      // Resolve the incoming values from any field-name alias the frontend may use
      const rawValues: any[] | undefined =
        body.formFiledValue ||   // legacy typo alias
        body.values ||           // direct values array
        body.formFieldValues;    // current frontend field name

      if (rawValues && Array.isArray(rawValues)) {
        // Incoming from UpdateFormData is simplified [{name, value}].
        // Merge onto existing doc.values to preserve type/mandatory/options so the
        // frontend's type-based rendering (formFieldData.type === 'text', etc.) still works.
        const existing: any[] = doc.values || doc.formFiledValue || [];
        const incomingMap = new Map<string, any>(
          rawValues.map((f: any) => [f.name, f.value]),
        );
        const existingNames = new Set(existing.map((f: any) => f.name));
        const merged = existing.map((f: any) => ({
          ...f,
          value: incomingMap.has(f.name) ? incomingMap.get(f.name) : f.value,
        }));
        // Add brand-new fields not previously in the document
        rawValues.forEach((f: any) => {
          if (!existingNames.has(f.name)) {
            merged.push({ name: f.name, type: "text", value: f.value, mandatory: false, options: [] });
          }
        });
        updateFields.values = merged;
      }

      await db
        .collection("formsubmissions")
        .updateOne({ _id: doc._id }, { $set: updateFields });
      res.json({ success: true, message: "Form data updated successfully" });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /submit-form/:id failed");
      res.status(500).json({ success: false, message: "Internal error" });
    }
  });

  // ── DELETE form submission ──
  gateway.delete("/submit-form/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");

      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await db
        .collection("formsubmissions")
        .deleteOne({ tenantId, $or: orClauses });
      if (result.deletedCount === 0) {
        res
          .status(404)
          .json({ success: false, message: "Form data not found" });
        return;
      }
      res.json({ success: true, message: "Form data deleted successfully" });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /submit-form/:id failed");
      res.status(500).json({ success: false, message: "Internal error" });
    }
  });

  // ── Save reordered columns ──
  gateway.post("/columns/save", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const body = req.body as any;

      const formId = body.formId;
      const companyId = body.companyId;
      const columns = body.columns || body.columnData || body.reorderedColumns || [];

      await db
        .collection("formlayouts")
        .updateOne(
          { tenantId, formId, companyId, type: "column" },
          { $set: { columns, updatedAt: new Date().toISOString() } },
          { upsert: true },
        );
      res.json({ success: true, message: "Columns saved successfully" });
    } catch (err) {
      logger.error({ err }, "Legacy POST /columns/save failed");
      res.status(500).json({ success: false, message: "Internal error" });
    }
  });

  // ── Save reordered rows ──
  gateway.post("/rows/save", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const body = req.body as any;

      const formId = body.formId;
      const companyId = body.companyId;
      const rows = body.rows || body.rowData || body.reorderedRows || [];

      // Decode role from JWT so the frontend he() callback can filter by role
      let userRole: string | undefined;
      try {
        const authHeader = (req.headers.authorization as string) || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (token) {
          const payload = tokenService.verifyAccessToken(token);
          userRole = (payload as any).role;
        }
      } catch { /* ignore — save without role if token unreadable */ }

      await db
        .collection("formlayouts")
        .updateOne(
          { tenantId, formId, companyId, type: "row", ...(userRole ? { role: userRole } : {}) },
          { $set: { rows, ...(userRole ? { role: userRole } : {}), updatedAt: new Date().toISOString() } },
          { upsert: true },
        );
      res.json({ success: true, message: "Rows saved successfully" });
    } catch (err) {
      logger.error({ err }, "Legacy POST /rows/save failed");
      res.status(500).json({ success: false, message: "Internal error" });
    }
  });

  // ── Columns ──
  // Prod: { success: true, columnData: [] }
  gateway.get("/columns", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ success: true, columnData: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const formId = req.query.formId as string | undefined;
      const query: any = { tenantId, type: "column" };
      if (formId) query.formId = formId;
      const docs = await mongoose.connection
        .db!.collection("formlayouts")
        .find(query)
        .toArray();
      // Return raw layout docs. The saved column ids are stale header labels that
      // no longer match the table's accessors, so the frontend (correctly) falls
      // back to showing ALL columns. Flattening them here hides valid fields.
      res.json({ success: true, columnData: docs });
    } catch (err) {
      logger.error({ err }, "Legacy columns query failed");
      res.json({ success: true, columnData: [] });
    }
  });

  // ── Rows ──
  // Prod: { success: true, rowData: [] }
  gateway.get("/rows", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ success: true, rowData: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const formId = req.query.formId as string | undefined;
      const query: any = { tenantId, type: "row" };
      if (formId) query.formId = formId;
      const docs = await mongoose.connection
        .db!.collection("formlayouts")
        .find(query)
        .toArray();
      // Drop "degenerate" saved layouts whose rows expose no real data columns —
      // only metadata (createdAt/updatedAt/companyId). The view-form-data table
      // derives its field columns from the submissions, then lets a saved layout
      // re-order them; but a layout that contains zero data columns can only WIPE
      // every enquiry field (Name, Mobile, Email, …) for that form+role, leaving
      // just createdAt/updatedAt. Such a layout is useless (and almost always
      // corrupted from an old reorder), so omit it and let the frontend fall back
      // to the full submission-derived column set (see GET /columns).
      const META_COLS = new Set(["createdat", "updatedat", "companyid"]);
      const meaningful = docs.filter((d: any) => {
        const rows: any[] = Array.isArray(d.rows) ? d.rows : [];
        return rows.some(
          (r: any) =>
            Array.isArray(r?.fields) &&
            r.fields.some(
              (f: any) =>
                f?.name && !META_COLS.has(String(f.name).toLowerCase()),
            ),
        );
      });
      res.json({ success: true, rowData: meaningful });
    } catch (err) {
      logger.error({ err }, "Legacy rows query failed");
      res.json({ success: true, rowData: [] });
    }
  });

  // ── Student Notes ──
  // GET /student-notes/reminders — returns active reminder notes for the current tenant
  // Must be registered before GET /student-notes to avoid being swallowed by the wildcard handler
  gateway.get("/student-notes/reminders", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ success: true, reminders: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const docs = await mongoose.connection
        .db!.collection("studentnotes")
        .find({
          tenantId,
          startTime: { $ne: null },
          $or: [{ endDate: null }, { endDate: { $gte: today } }],
        })
        .sort({ startTime: 1 })
        .toArray();
      res.json({
        success: true,
        reminders: docs.map((d: any) => ({
          _id: d._legacyId || d._id.toString(),
          studentId: d.studentId || d.userId || null,
          particulars: d.particulars || "",
          startTime: d.startTime || null,
          endDate: d.endDate || null,
          addedBy: d.addedBy || "",
        })),
      });
    } catch (err) {
      logger.error({ err }, "Legacy student-notes/reminders query failed");
      res.json({ success: true, reminders: [] });
    }
  });

  // Prod: { success: true, allStudentNotes: [{ _id, date, particulars, startTime, addedBy, userId, companyId, createdAt, updatedAt, __v }] }
  gateway.get("/student-notes", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ success: true, allStudentNotes: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const docs = await mongoose.connection
        .db!.collection("studentnotes")
        .find({ tenantId })
        .toArray();

      // Backfill companyId for notes that lack it. Enquiry notes are saved with only
      // a studentId (the enquiry submission's id) and no companyId, but the Reminder
      // Task calendar filters notes by companyId === <urlCompanyId> — so a note without
      // one never appears. Resolve it from the linked submission (studentId → its
      // companyId) so those reminders show on the calendar.
      const needIds = [
        ...new Set(
          docs
            .filter((d: any) => !d.companyId && (d.studentId || d.userId))
            .map((d: any) => String(d.studentId || d.userId)),
        ),
      ];
      const subCompanyById = new Map<string, string>();
      if (needIds.length) {
        const objIds = needIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        const subs = await mongoose.connection
          .db!.collection("formsubmissions")
          .find({
            tenantId,
            $or: [{ _id: { $in: objIds } }, { _legacyId: { $in: needIds } }],
          })
          .toArray();
        for (const s of subs as any[]) {
          if (s.companyId == null) continue;
          const companyId = String(s.companyId);
          if (s._id) subCompanyById.set(s._id.toString(), companyId);
          if (s._legacyId) subCompanyById.set(String(s._legacyId), companyId);
        }
      }

      res.json({
        success: true,
        allStudentNotes: docs.map((d: any) => ({
          _id: d._legacyId || d._id.toString(),
          date: d.date,
          particulars: d.particulars || "",
          startTime: d.startTime || null,
          addedBy: d.addedBy || "",
          userId: d.userId || d.studentId || null,
          companyId:
            d.companyId ||
            subCompanyById.get(String(d.studentId || d.userId || "")) ||
            null,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt || d.createdAt,
          __v: 0,
        })),
      });
    } catch (err) {
      logger.error({ err }, "Legacy student-notes query failed");
      res.json({ success: true, allStudentNotes: [] });
    }
  });

  // ── Helper: load course map for student population ──
  async function loadCourseMap(tenantId: string): Promise<Map<string, any>> {
    const { default: mongoose } = await import("mongoose");
    const courses = await mongoose.connection
      .db!.collection("courses")
      .find({ tenantId })
      .toArray();
    // Load categories to resolve category name → category _id
    const categories = await mongoose.connection
      .db!.collection("categories")
      .find({ tenantId })
      .toArray();
    const catNameToId = new Map<string, string>();
    categories.forEach((cat: any) => {
      catNameToId.set(
        cat.name || cat.category || "",
        cat._legacyId || cat._id.toString(),
      );
    });

    const map = new Map<string, any>();
    courses.forEach((c: any) => {
      // Enrich course with resolved categoryId
      const catId = catNameToId.get(c.category || "") || c.category || null;
      c._resolvedCategoryId = catId;
      map.set(c._id.toString(), c);
      if (c._legacyId) map.set(String(c._legacyId), c);
    });
    return map;
  }

  // ── Students list (raw MongoDB → legacy format with populated courseName) ──
  gateway.get("/students", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ users: [] });
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const courseMap = await loadCourseMap(tenantId);

      // Prod sorts by name ascending (binary). Build name from firstName+lastName for sort.
      const students = await mongoose.connection
        .db!.collection("students")
        .find({ tenantId })
        .toArray();

      // Map to legacy format first, then sort by name (binary, matches prod)
      const mapped = students.map((s: any) => mapStudentToLegacy(s, courseMap));
      mapped.sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || ""),
      );

      res.json({ users: mapped });
    } catch (err) {
      logger.error({ err }, "Legacy students list query failed");
      res.json({ users: [] });
    }
  });

  // ── Students by company (all students for a company) ──
  // ── All students (GET /students) — raw MongoDB with mapStudentToLegacy ──
  // Frontend reads: response.data.users (AdmissionContext.js)
  gateway.get("/students", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ users: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const students = await mongoose.connection
        .db!.collection("students")
        .find({ tenantId })
        .sort({ createdAt: -1 })
        .toArray();
      const courseMap = await loadCourseMap(tenantId);
      res.json({
        users: students.map((s: any) => mapStudentToLegacy(s, courseMap)),
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /students failed");
      res.json({ users: [] });
    }
  });

  // ── Serve student images with default avatar fallback ──
  // Handles both /images/file.jpg and /images/students/file.jpg
  gateway.get("/images/*", async (req: Request, res: Response) => {
    const { default: path } = await import("path");
    const { default: fs } = await import("fs");
    const imgPath = (req.params as any)[0] as string;
    const defaultAvatar = path.join(
      process.cwd(),
      "frontend-build",
      "media",
      "avatars",
      "blank.png",
    );
    if (
      !imgPath ||
      imgPath === "undefined" ||
      imgPath === "null" ||
      imgPath === ""
    ) {
      res.sendFile(defaultAvatar);
      return;
    }
    const filename = path.basename(imgPath);
    const locations = [
      path.join(process.cwd(), "uploads", imgPath), // uploads/students/file.jpg
      path.join(process.cwd(), "uploads", "students", filename), // uploads/students/file.jpg (flat)
      path.join(process.cwd(), "uploads", filename), // uploads/file.jpg
      path.join(process.cwd(), "images", filename), // images/file.jpg (legacy)
    ];
    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        res.sendFile(loc);
        return;
      }
    }
    res.sendFile(defaultAvatar);
  });

  gateway.get(
    "/students/company/:companyId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }

        const { default: mongoose } = await import("mongoose");
        const companyId = p(req, "companyId");
        const students = await mongoose.connection
          .db!.collection("students")
          .find({
            tenantId,
            $or: [
              { companyName: companyId },
              { "enrollment.companyId": companyId },
            ],
          })
          .toArray();
        const courseMap = await loadCourseMap(tenantId);

        const mapped = students.map((s: any) =>
          mapStudentToLegacy(s, courseMap),
        );
        mapped.sort((a: any, b: any) =>
          (a.name || "").localeCompare(b.name || ""),
        );
        res.json(mapped);
      } catch (err) {
        logger.error({ err }, "Legacy students by company query failed");
        res.json([]);
      }
    },
  );

  // ── Students by company+course ──
  // Frontend reads: { success: true, data: [...students...] }
  gateway.get(
    "/students/company/:companyId/course/:courseId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json({ success: true, data: [] });
          return;
        }

        const companyId = p(req, "companyId");
        const courseId = p(req, "courseId");
        const { default: mongoose } = await import("mongoose");
        const courseMap = await loadCourseMap(tenantId);

        // The courseId from the URL may be a legacy ID (prod _id) or dev _id.
        // Students store enrollment.courseId as dev _id. Build lookup set.
        const courseIds = new Set<string>([courseId]);
        for (const [devId, c] of courseMap) {
          if (c._legacyId === courseId) courseIds.add(devId);
          if (devId === courseId) courseIds.add(devId);
        }

        const students = await mongoose.connection
          .db!.collection("students")
          .find({
            tenantId,
            $or: [
              { companyName: companyId },
              { "enrollment.companyId": companyId },
            ],
            "enrollment.courseId": { $in: [...courseIds] },
          })
          .sort({ createdAt: -1 })
          .toArray();
        // Return students with courseName as string (not object) to avoid React rendering errors
        const mapped = students.map((s: any) => {
          const legacy = mapStudentToLegacy(s, courseMap);
          // Flatten courseName for rendering — keep as string for React child safety
          if (legacy.courseName && typeof legacy.courseName === "object") {
            legacy.select_course =
              legacy.courseName.courseName || legacy.select_course;
            legacy.courseName =
              legacy.courseName._id || String(legacy.courseName);
          }
          return legacy;
        });
        res.json({ success: true, data: mapped });
      } catch (err) {
        logger.error({ err }, "Legacy students by company+course query failed");
        res.json({ success: true, data: [] });
      }
    },
  );

  // ── Commissions list ──
  // studentName is stored as plain string "Name_With_Underscores-RollNumber"
  // Frontend filters by ?studentName=... and uses .split('-')[0] / .split('-')[1]
  async function fetchCommissionsLegacy(
    tenantId: string,
    res: Response,
    filterName?: string,
  ): Promise<void> {
    const { default: mongoose } = await import("mongoose");
    const db = mongoose.connection.db!;
    const query: any = { tenantId };
    if (filterName) query.studentName = filterName;
    const commissions = await db
      .collection("commissions")
      .find(query)
      .sort({ commissionDate: -1 })
      .toArray();

    res.json(
      commissions.map((c: any) => ({
        _id: c._legacyId || c._id.toString(),
        studentName: c.studentName || "",
        commissionPersonName: c.commissionPersonName || "",
        voucherNumber: c.voucherNumber || "",
        commissionAmount: Number(c.commissionAmount) || 0,
        commissionPaid: Number(c.commissionPaid) || 0,
        commissionRemaining: Number(c.commissionRemaining) || 0,
        commissionDate: c.commissionDate,
        narration: c.narration || "",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt || c.createdAt,
        __v: 0,
      })),
    );
  }

  // ── Timing list + create (raw MongoDB: DDD strips companyId, filter needs it) ──
  gateway.get("/add-timing", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const timings = await mongoose.connection
        .db!.collection("timings")
        .find({ tenantId })
        .sort({ createdAt: -1 })
        .toArray();
      res.json(
        timings.map((t: any) => ({
          _id: t._legacyId || t._id.toString(),
          startTime: t.startTime || "",
          endTime: t.endTime || "",
          companyId: t.companyId ? String(t.companyId) : null,
          isActive: t.isActive ?? true,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt || t.createdAt,
          __v: 0,
        })),
      );
    } catch (err) {
      logger.error({ err }, "Legacy add-timing GET failed");
      res.json([]);
    }
  });

  gateway.post("/add-timing", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const body = req.body as any;
      if (!body.startTime || !body.endTime) {
        res.status(400).json({ message: "startTime and endTime are required" });
        return;
      }
      const now = new Date();
      const doc = {
        tenantId,
        startTime: body.startTime,
        endTime: body.endTime,
        companyId: body.companyId || null,
        isActive: body.isActive !== false,
        createdAt: now,
        updatedAt: now,
      };
      const result = await mongoose.connection
        .db!.collection("timings")
        .insertOne(doc);
      res.status(201).json({ _id: result.insertedId.toString(), ...doc });
    } catch (err) {
      logger.error({ err }, "Legacy add-timing POST failed");
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Batch create: map companyId → courseCategory (DDD reads courseCategory, frontend sends companyId) ──
  gateway.post(
    "/batches",
    (req: Request, _res: Response, next: NextFunction) => {
      const body = req.body as any;
      if (body && body.companyId && !body.courseCategory) {
        body.courseCategory = body.companyId;
      }
      next();
    },
  );

  // ── Batch list by company (response must be { data: [...] } with trainer populated) ──
  gateway.get(
    "/batches/company/:companyId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json({ data: [] });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const companyId = p(req, "companyId");

        // DDD stores company association in courseCategory field (frontend sends companyId, mapped at create time)
        // Also include batches with no company assigned (empty/null courseCategory) — legacy migrated data
        // When companyId is "undefined" (AddStudentToBatch calls without company), return ALL batches
        const isAllBatches =
          !companyId || companyId === "undefined" || companyId === "null";
        const batchFilter: any = { tenantId };
        if (!isAllBatches) {
          batchFilter.$or = [
            { courseCategory: companyId },
            { companyId: companyId },
            { courseCategory: { $in: ["", null, undefined] } },
            { courseCategory: { $exists: false } },
          ];
        }
        const batches = await mongoose.connection
          .db!.collection("batches")
          .find(batchFilter)
          .sort({ createdAt: -1 })
          .toArray();

        if (!batches.length) {
          res.json({ data: [] });
          return;
        }

        // Collect trainer IDs to populate (DDD uses 'trainer', legacy uses 'trainerId' which stores _legacyId)
        const trainerIdSet = new Set<string>();
        batches.forEach((b: any) => {
          if (b.trainer) trainerIdSet.add(String(b.trainer));
          if (b.trainerId) trainerIdSet.add(String(b.trainerId));
        });
        const rawTrainerIds = [...trainerIdSet].filter(Boolean);
        const trainerDocs = rawTrainerIds.length
          ? await mongoose.connection
              .db!.collection("trainers")
              .find({
                $or: [
                  // match by actual _id
                  {
                    _id: {
                      $in: rawTrainerIds
                        .filter((id: any) =>
                          mongoose.Types.ObjectId.isValid(id),
                        )
                        .map((id: any) => new mongoose.Types.ObjectId(id)),
                    },
                  },
                  // match by _legacyId (legacy batches store the old trainer _id as trainerId)
                  { _legacyId: { $in: rawTrainerIds } },
                ],
              })
              .toArray()
          : [];
        // Build lookup map by both _id and _legacyId so both formats resolve
        const trainerMap = new Map<string, any>();
        trainerDocs.forEach((t: any) => {
          trainerMap.set(t._id.toString(), t);
          if (t._legacyId) trainerMap.set(String(t._legacyId), t);
        });

        // Collect all student IDs across all batches for bulk population
        const allStudentIds = new Set<string>();
        batches.forEach((b: any) => {
          (b.students || []).forEach((s: any) => {
            const sid = s.student
              ? String(s.student)
              : s.studentId
                ? String(s.studentId)
                : null;
            if (sid) allStudentIds.add(sid);
          });
        });

        // Bulk fetch students
        const studentOrClauses: any[] = [];
        allStudentIds.forEach((sid) => {
          studentOrClauses.push({ _legacyId: sid });
          if (mongoose.Types.ObjectId.isValid(sid))
            studentOrClauses.push({ _id: new mongoose.Types.ObjectId(sid) });
        });
        const studentDocs = studentOrClauses.length
          ? await mongoose.connection
              .db!.collection("students")
              .find({ tenantId, $or: studentOrClauses })
              .toArray()
          : [];
        const studentMap = new Map<string, any>();
        studentDocs.forEach((s: any) => {
          studentMap.set(s._id.toString(), s);
          if (s._legacyId) studentMap.set(s._legacyId, s);
        });

        // Bulk fetch courses for student enrollments
        const courseIds = new Set<string>();
        studentDocs.forEach((s: any) => {
          const cid = (
            s.enrollment?.courseId || s.enrollments?.[0]?.courseId
          )?.toString();
          if (cid) courseIds.add(cid);
        });
        const courseOrClauses: any[] = [];
        courseIds.forEach((cid) => {
          courseOrClauses.push({ _legacyId: cid });
          if (mongoose.Types.ObjectId.isValid(cid))
            courseOrClauses.push({ _id: new mongoose.Types.ObjectId(cid) });
        });
        const courseDocs = courseOrClauses.length
          ? await mongoose.connection
              .db!.collection("courses")
              .find({ tenantId, $or: courseOrClauses })
              .toArray()
          : [];
        const courseMap = new Map<string, any>();
        courseDocs.forEach((c: any) => {
          courseMap.set(c._id.toString(), c);
          if (c._legacyId) courseMap.set(c._legacyId, c);
        });

        // Bulk fetch subjects — build maps by _id, _legacyId, and courseId+name for precise matching
        const allSubjects = await mongoose.connection
          .db!.collection("subjects")
          .find({ tenantId })
          .toArray();
        const subjectByIdMap = new Map<string, any>();
        // Map: courseId → Map<subjectNameLowerCase, subjectDoc>
        const subjectByCourseNameMap = new Map<string, Map<string, any>>();
        allSubjects.forEach((s: any) => {
          subjectByIdMap.set(s._id.toString(), s);
          if (s._legacyId) subjectByIdMap.set(s._legacyId, s);
          // Index by courseId + name for course-specific lookup
          const cid = s.courseId ? String(s.courseId) : "__none__";
          if (!subjectByCourseNameMap.has(cid))
            subjectByCourseNameMap.set(cid, new Map());
          if (s.subjectName)
            subjectByCourseNameMap
              .get(cid)!
              .set(s.subjectName.toLowerCase(), s);
        });

        // Resolve subject by name, preferring the student's course
        function resolveSubjectByName(
          name: string,
          courseLegacyId?: string,
        ): any {
          const lname = name.toLowerCase();
          // Try course-specific first
          if (courseLegacyId) {
            const courseSubjects = subjectByCourseNameMap.get(courseLegacyId);
            if (courseSubjects?.has(lname)) return courseSubjects.get(lname);
          }
          // Fallback: any course
          for (const [, nameMap] of subjectByCourseNameMap) {
            if (nameMap.has(lname)) return nameMap.get(lname);
          }
          return null;
        }

        // Helper to populate a single batch student entry
        function populateBatchStudent(s: any) {
          if (typeof s === "string") return null;
          const sid = s.student
            ? String(s.student)
            : s.studentId
              ? String(s.studentId)
              : null;
          if (!sid) return null;
          const studentDoc = studentMap.get(sid);
          const enrollment =
            studentDoc?.enrollment || studentDoc?.enrollments?.[0];
          const courseId = enrollment?.courseId?.toString();
          const course = courseId ? courseMap.get(courseId) || null : null;
          const courseLegacyId = course?._legacyId || course?._id?.toString();

          const subjects = Array.isArray(s.subjects)
            ? s.subjects.map((sub: any) => {
                const subRef = sub.subject
                  ? String(sub.subject)
                  : sub.subjectName || null;
                let subjectObj: any = null;
                if (subRef) {
                  // Try by ID first, then by name with course context
                  const subDoc =
                    subjectByIdMap.get(subRef) ||
                    resolveSubjectByName(subRef, courseLegacyId);
                  subjectObj = subDoc
                    ? {
                        _id: subDoc._legacyId || subDoc._id.toString(),
                        subjectName: subDoc.subjectName || "",
                      }
                    : { _id: subRef, subjectName: sub.subjectName || subRef };
                }
                return { ...sub, subject: subjectObj };
              })
            : [];

          const studentName = studentDoc
            ? studentDoc.name ||
              [studentDoc.firstName, studentDoc.lastName]
                .filter(Boolean)
                .join(" ") ||
              ""
            : "";

          return {
            _id: s._id?.toString?.() || sid,
            student: studentDoc
              ? {
                  _id: studentDoc._legacyId || studentDoc._id.toString(),
                  name: studentName,
                  email: studentDoc.contact?.email || studentDoc.email || "",
                  phone:
                    studentDoc.contact?.mobile ||
                    studentDoc.mobile_number ||
                    "",
                  courseName: course
                    ? {
                        _id: course._legacyId || course._id.toString(),
                        courseName: course.name || "",
                      }
                    : null,
                  date_of_joining: enrollment?.dateOfJoining || null,
                  remainingCourseFees: enrollment?.remainingFees ?? 0,
                }
              : { _id: sid, name: "" },
            studentId: sid,
            subjects,
            // Populate currentSoftware with subject names if subjects exist (batch details shows this column)
            currentSoftware:
              s.currentSoftware ||
              subjects
                .map((sub: any) => sub.subject?.subjectName)
                .filter(Boolean)
                .join(", ") ||
              "",
          };
        }

        res.json({
          data: batches.map((b: any) => {
            const rawTId = String(b.trainer || b.trainerId || "");
            const rawTId2 = b.trainerId ? String(b.trainerId) : "";
            const trainerDoc = rawTId
              ? trainerMap.get(rawTId) ||
                (rawTId2 ? trainerMap.get(rawTId2) : null) ||
                null
              : null;
            return {
              _id: b._id.toString(), // always real _id so GET /batches/:id can find it
              _legacyId: b._legacyId || null,
              name: b.name || b.batchName || "",
              courseCategory: b.courseCategory || b.companyId || "",
              course: b.course || "",
              trainer: trainerDoc
                ? {
                    _id: trainerDoc._id.toString(),
                    trainerName:
                      trainerDoc.trainerName || trainerDoc.name || "",
                    trainerDesignation:
                      trainerDoc.trainerDesignation ||
                      trainerDoc.specialization ||
                      "",
                    trainerEmail:
                      trainerDoc.trainerEmail || trainerDoc.email || "",
                  }
                : null,
              startTime: b.startTime || b.batchTime || "",
              endTime: b.endTime || "",
              startDate: b.startDate || b.batchStartDate || null,
              endDate: b.endDate || b.batchEndDate || null,
              status: b.status || "inProgress",
              students: (b.students || [])
                .map(populateBatchStudent)
                .filter(Boolean),
              isActive: b.isActive ?? true,
              createdAt: b.createdAt,
              updatedAt: b.updatedAt || b.createdAt,
              __v: 0,
            };
          }),
        });
      } catch (err) {
        logger.error({ err }, "Legacy batches/company GET failed");
        res.json({ data: [] });
      }
    },
  );

  // ── Trainer helpers ──
  function trainerToLegacy(t: any): any {
    return {
      _id: t._legacyId || t._id?.toString(),
      trainerName: t.trainerName || t.name || "",
      trainerEmail: t.trainerEmail || t.email || "",
      trainerRole: t.trainerRole || "Trainer",
      trainerDesignation: t.trainerDesignation || t.specialization || "",
      trainerImage: t.trainerImage || t.image || "",
      companyId: t.companyId || null,
      isActive: t.isActive ?? true,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt || t.createdAt,
      __v: 0,
    };
  }

  // ── Trainer list (GET /add-trainer) — raw collection, legacy field names ──
  // Frontend reads: response.data.trainers (AttendanceContext.js:57)
  gateway.get("/add-trainer", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ trainers: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const trainers = await mongoose.connection
        .db!.collection("trainers")
        .find({ tenantId })
        .sort({ createdAt: -1 })
        .toArray();
      res.json({ trainers: trainers.map(trainerToLegacy) });
    } catch (err) {
      logger.error({ err }, "Legacy add-trainer GET failed");
      res.json({ trainers: [] });
    }
  });

  // ── Trainer create (FormData → raw MongoDB insert with legacy field names) ──
  gateway.post(
    "/add-trainer",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }

        const { default: multer } = await import("multer");
        const { default: path } = await import("path");
        const { default: fs } = await import("fs");

        const uploadDir = path.join(process.cwd(), "uploads", "trainers");
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });

        const storage = multer.diskStorage({
          destination: (_req, _file, cb) => cb(null, uploadDir),
          filename: (_req, file, cb) =>
            cb(null, `trainer-${Date.now()}${path.extname(file.originalname)}`),
        });
        const upload = multer({
          storage,
          limits: { fileSize: 5 * 1024 * 1024 },
        }).single("trainerImage");

        upload(req, res, async (err) => {
          if (err) {
            res.status(400).json({ message: err.message });
            return;
          }

          const body = req.body as any;
          const { default: mongoose } = await import("mongoose");

          const name = body.trainerName || body.name || "";
          if (!name) {
            res.status(400).json({ message: "Trainer name is required" });
            return;
          }

          const now = new Date();
          const trainerDoc = {
            tenantId,
            // Legacy field names (for list/filter compatibility)
            trainerName: name,
            trainerEmail: body.trainerEmail || body.email || "",
            trainerRole: body.trainerRole || "Trainer",
            trainerDesignation: body.trainerDesignation || "",
            trainerImage: (req as any).file
              ? `trainers/${(req as any).file.filename}`
              : "",
            companyId: body.companyId || null,
            // DDD field names (for Mongoose model compatibility)
            name,
            email: body.trainerEmail || body.email || undefined,
            specialization: body.trainerDesignation || undefined,
            isActive: true,
            createdBy: (req as any).user?.id || "system",
            createdAt: now,
            updatedAt: now,
          };

          const result = await mongoose.connection
            .db!.collection("trainers")
            .insertOne(trainerDoc);
          res.status(201).json({
            _id: result.insertedId.toString(),
            ...trainerToLegacy({ ...trainerDoc, _id: result.insertedId }),
          });
        });
      } catch (err) {
        logger.error({ err }, "Legacy add-trainer POST failed");
        next(err);
      }
    },
  );

  // Build a filter that matches by _id or _legacyId (migrated trainers expose _legacyId as _id)
  async function trainerByIdFilter(id: string, tenantId: string) {
    const { default: mongoose } = await import("mongoose");
    const oid = new mongoose.Types.ObjectId(id);
    return { $or: [{ _id: oid }, { _legacyId: id }], tenantId } as Record<
      string,
      any
    >;
  }

  // ── Trainer GET by ID (GET /add-trainer/:id) — raw collection, legacy field names ──
  // Frontend reads: response.data.trainer (edit form component)
  gateway.get("/add-trainer/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ trainer: null });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const filter = await trainerByIdFilter(p(req, "id"), tenantId);
      const trainer = await mongoose.connection
        .db!.collection("trainers")
        .findOne(filter);
      if (!trainer) {
        res.status(404).json({ message: "Trainer not found" });
        return;
      }
      res.json({ trainer: trainerToLegacy(trainer) });
    } catch (err) {
      logger.error({ err }, "Legacy add-trainer GET/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Trainer update (PUT /add-trainer/:id) — FormData with legacy field names ──
  gateway.put(
    "/add-trainer/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }

        const { default: multer } = await import("multer");
        const { default: path } = await import("path");
        const { default: fs } = await import("fs");

        const uploadDir = path.join(process.cwd(), "uploads", "trainers");
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });

        const storage = multer.diskStorage({
          destination: (_req, _file, cb) => cb(null, uploadDir),
          filename: (_req, file, cb) =>
            cb(null, `trainer-${Date.now()}${path.extname(file.originalname)}`),
        });
        const upload = multer({
          storage,
          limits: { fileSize: 5 * 1024 * 1024 },
        }).single("trainerImage");

        upload(req, res, async (err) => {
          if (err) {
            res.status(400).json({ message: err.message });
            return;
          }

          const body = req.body as any;
          const { default: mongoose } = await import("mongoose");

          const updateFields: Record<string, any> = { updatedAt: new Date() };

          // Map legacy field names to both legacy and DDD field names
          const name = body.trainerName || body.name;
          if (name) {
            updateFields.trainerName = name;
            updateFields.name = name;
          }

          const email = body.trainerEmail || body.email;
          if (email) {
            updateFields.trainerEmail = email;
            updateFields.email = email;
          }

          const designation = body.trainerDesignation || body.specialization;
          if (designation) {
            updateFields.trainerDesignation = designation;
            updateFields.specialization = designation;
          }

          if (body.trainerRole) {
            updateFields.trainerRole = body.trainerRole;
          }
          if (body.phone) {
            updateFields.phone = body.phone;
          }
          if (body.isActive !== undefined) {
            updateFields.isActive =
              body.isActive === "true" || body.isActive === true;
          }

          if ((req as any).file) {
            updateFields.trainerImage = `trainers/${(req as any).file.filename}`;
          }

          const filter = await trainerByIdFilter(p(req, "id"), tenantId);
          const result = await mongoose.connection
            .db!.collection("trainers")
            .findOneAndUpdate(
              filter,
              { $set: updateFields },
              { returnDocument: "after" },
            );

          if (!result) {
            res.status(404).json({ message: "Trainer not found" });
            return;
          }
          res.json(trainerToLegacy(result));
        });
      } catch (err) {
        logger.error({ err }, "Legacy add-trainer PUT failed");
        next(err);
      }
    },
  );

  // ── Trainer delete (DELETE /add-trainer/:id) — raw MongoDB delete ──
  gateway.delete("/add-trainer/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const filter = await trainerByIdFilter(p(req, "id"), tenantId);
      const result = await mongoose.connection
        .db!.collection("trainers")
        .deleteOne(filter);
      if (result.deletedCount === 0) {
        res.status(404).json({ message: "Trainer not found" });
        return;
      }
      res.json({ success: true, message: "Trainer deleted" });
    } catch (err) {
      logger.error({ err }, "Legacy add-trainer DELETE failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Add student to batch (POST /batches/:id/student) ──
  // Frontend sends: { studentId, subjects: [{subject: "subjectId"}], currentSoftware }
  // DDD expects:    { studentId, subjects: [{subjectName: "..."}], currentSoftware }
  gateway.post("/batches/:id/student", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const batchId = p(req, "id");
      const body = req.body as any;

      // Resolve subject IDs to subject names
      let subjects: any[] = [];
      if (Array.isArray(body.subjects) && body.subjects.length > 0) {
        const subjectIds = body.subjects
          .map((s: any) => s.subject || s.subjectId || s)
          .filter(Boolean);
        const allSubjects = await db
          .collection("subjects")
          .find({ tenantId })
          .toArray();
        const subjectMap = new Map<string, any>();
        allSubjects.forEach((s) => {
          subjectMap.set(s._id.toString(), s);
          if (s._legacyId) subjectMap.set(s._legacyId, s);
        });

        subjects = subjectIds.map((id: string) => {
          const sub = subjectMap.get(id);
          return {
            subjectName: sub?.subjectName || id,
            status: "notStarted",
            progress: 0,
          };
        });
      }

      // Find batch by _id or _legacyId
      const batchOid = new mongoose.Types.ObjectId(batchId);
      const batch = await db.collection("batches").findOne({
        $or: [{ _id: batchOid }, { _legacyId: batchId }],
        tenantId,
      });
      if (!batch) {
        res.status(404).json({ message: "Batch not found" });
        return;
      }

      // Resolve studentId (could be _legacyId)
      let resolvedStudentId = body.studentId;
      try {
        const studentOid = new mongoose.Types.ObjectId(body.studentId);
        const student = await db.collection("students").findOne({
          $or: [{ _id: studentOid }, { _legacyId: body.studentId }],
          tenantId,
        });
        if (student) resolvedStudentId = student._id.toString();
      } catch {
        /* keep original */
      }

      // Check if student already in batch
      const existingStudents = Array.isArray(batch.students)
        ? batch.students
        : [];
      if (
        existingStudents.some((s: any) => s.studentId === resolvedStudentId)
      ) {
        res.status(409).json({ message: "Student already in batch" });
        return;
      }

      // Add student directly via raw MongoDB
      const studentEntry = {
        studentId: resolvedStudentId,
        subjects,
        currentSoftware: body.currentSoftware || "",
      };

      await db.collection("batches").updateOne(
        { _id: batch._id },
        {
          $push: { students: studentEntry } as any,
          $set: { updatedAt: new Date() },
        },
      );

      res.json({ success: true, data: { message: "Student added to batch" } });
    } catch (err) {
      logger.error({ err }, "Legacy POST /batches/:id/student failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Update subject status (PUT /batches/:id/student/:studentId/subject/:subjectId) ──
  gateway.put(
    "/batches/:id/student/:studentId/subject/:subjectId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const batchId = p(req, "id");
        const studentId = p(req, "studentId");
        const subjectId = p(req, "subjectId");
        const body = req.body as any;

        // Find batch
        const batchOr: any[] = [{ _legacyId: batchId }];
        if (mongoose.Types.ObjectId.isValid(batchId))
          batchOr.push({ _id: new mongoose.Types.ObjectId(batchId) });
        const batch = await db
          .collection("batches")
          .findOne({ tenantId, $or: batchOr });
        if (!batch) {
          res.status(404).json({ message: "Batch not found" });
          return;
        }

        // Resolve student ID variants
        const studentOr: any[] = [{ _legacyId: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId))
          studentOr.push({ _id: new mongoose.Types.ObjectId(studentId) });
        const studentDoc = await db
          .collection("students")
          .findOne({ tenantId, $or: studentOr });
        const idVariants: string[] = [studentId];
        if (studentDoc) {
          idVariants.push(studentDoc._id.toString());
          if (studentDoc._legacyId) idVariants.push(studentDoc._legacyId);
        }

        // Resolve subjectId to subjectName for matching
        let resolvedSubjectName = subjectId;
        if (mongoose.Types.ObjectId.isValid(subjectId)) {
          const subDoc = await db.collection("subjects").findOne({
            tenantId,
            $or: [
              { _id: new mongoose.Types.ObjectId(subjectId) },
              { _legacyId: subjectId },
            ],
          });
          if (subDoc) resolvedSubjectName = subDoc.subjectName;
        }

        // Find and update the subject in the batch student entry
        let updated = false;
        const students = batch.students || [];
        for (const s of students) {
          const sid = s.student
            ? String(s.student)
            : s.studentId
              ? String(s.studentId)
              : null;
          if (!sid || !idVariants.includes(sid)) continue;

          const subjects = s.subjects || [];
          for (const sub of subjects) {
            const subName = sub.subjectName || sub.subject?.subjectName || "";
            const subRef = sub.subject ? String(sub.subject) : subName;
            // Match by subjectId, _legacyId, name, or resolved name
            if (
              subRef === subjectId ||
              subName === subjectId ||
              sub._id?.toString() === subjectId ||
              subName === resolvedSubjectName
            ) {
              if (body.status !== undefined) sub.status = body.status;
              if (body.progress !== undefined)
                sub.progress = Number(body.progress);
              if (body.notes !== undefined) sub.notes = body.notes;
              if (body.startDate !== undefined) sub.startDate = body.startDate;
              if (body.completionDate !== undefined)
                sub.completionDate = body.completionDate;
              updated = true;
              break;
            }
          }
          if (updated) break;
        }

        if (!updated) {
          res.status(404).json({ message: "Subject not found in batch" });
          return;
        }

        await db
          .collection("batches")
          .updateOne(
            { _id: batch._id },
            { $set: { students, updatedAt: new Date() } },
          );

        res.json({ success: true, message: "Subject status updated" });
      } catch (err) {
        logger.error(
          { err },
          "Legacy PUT /batches/:id/student/:studentId/subject/:subjectId failed",
        );
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // ── Student progress in batch (GET /batches/:id/student/:studentId/progress) ──
  gateway.get(
    "/batches/:id/student/:studentId/progress",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json(null);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const batchId = p(req, "id");
        const studentId = p(req, "studentId");

        // Find batch
        const batchOr: any[] = [{ _legacyId: batchId }];
        if (mongoose.Types.ObjectId.isValid(batchId))
          batchOr.push({ _id: new mongoose.Types.ObjectId(batchId) });
        const batch = await db
          .collection("batches")
          .findOne({ tenantId, $or: batchOr });
        if (!batch) {
          res.json({ subjects: [] });
          return;
        }

        // Resolve student ID variants
        const studentOr: any[] = [{ _legacyId: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId))
          studentOr.push({ _id: new mongoose.Types.ObjectId(studentId) });
        const studentDoc = await db
          .collection("students")
          .findOne({ tenantId, $or: studentOr });
        const idVariants = [studentId];
        if (studentDoc) {
          idVariants.push(studentDoc._id.toString());
          if (studentDoc._legacyId) idVariants.push(studentDoc._legacyId);
        }

        // Find student in batch
        const batchStudent = (batch.students || []).find((s: any) => {
          const sid = s.student
            ? String(s.student)
            : s.studentId
              ? String(s.studentId)
              : null;
          return sid && idVariants.includes(sid);
        });

        if (!batchStudent) {
          res.json({ subjects: [] });
          return;
        }

        // Resolve subjects — wrap in {subject: {subjectName}} format for frontend
        const subjects = (batchStudent.subjects || []).map((sub: any) => ({
          subject: sub.subject || { subjectName: sub.subjectName || "" },
          status: sub.status || "notStarted",
          progress: sub.progress || 0,
          startDate: sub.startDate || null,
          completionDate: sub.completionDate || null,
          notes: sub.notes || "",
        }));

        // Calculate overall progress
        const totalProgress = subjects.reduce(
          (sum: number, s: any) => sum + (s.progress || 0),
          0,
        );
        const overallProgress =
          subjects.length > 0 ? Math.round(totalProgress / subjects.length) : 0;

        res.json({
          success: true,
          data: {
            studentId:
              studentDoc?._legacyId || studentDoc?._id?.toString() || studentId,
            batchId: batch._id.toString(),
            subjects,
            currentSoftware: batchStudent.currentSoftware || "",
            overallProgress,
          },
        });
      } catch (err) {
        logger.error(
          { err },
          "Legacy GET /batches/:id/student/:studentId/progress failed",
        );
        res.json({ subjects: [] });
      }
    },
  );

  // ── Remove student from batch (DELETE /batches/:id/student/:studentId) ──
  // Frontend sends _legacyId but batch stores real _id as studentId
  gateway.delete(
    "/batches/:id/student/:studentId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const batchId = p(req, "id");
        const studentId = p(req, "studentId");

        // Find batch by _id or _legacyId
        const batchOr: any[] = [{ _legacyId: batchId }];
        if (mongoose.Types.ObjectId.isValid(batchId))
          batchOr.push({ _id: new mongoose.Types.ObjectId(batchId) });
        const batch = await db
          .collection("batches")
          .findOne({ tenantId, $or: batchOr });
        if (!batch) {
          res.status(404).json({ message: "Batch not found" });
          return;
        }

        // Resolve studentId — frontend may send _legacyId, batch stores real _id
        const studentOr: any[] = [{ _legacyId: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId))
          studentOr.push({ _id: new mongoose.Types.ObjectId(studentId) });
        const studentDoc = await db
          .collection("students")
          .findOne({ tenantId, $or: studentOr });

        // Build all possible ID variants to match against batch students
        const idVariants: string[] = [studentId];
        if (studentDoc) {
          idVariants.push(studentDoc._id.toString());
          if (studentDoc._legacyId) idVariants.push(studentDoc._legacyId);
        }

        // Pull student matching any ID variant
        const result = await db.collection("batches").updateOne(
          { _id: batch._id },
          {
            $pull: {
              students: {
                $or: [
                  { studentId: { $in: idVariants } },
                  { student: { $in: idVariants } },
                ],
              },
            } as any,
            $set: { updatedAt: new Date() },
          },
        );

        if (result.modifiedCount === 0) {
          res.status(404).json({ message: "Student not found in batch" });
          return;
        }
        res.json({ success: true, message: "Student removed from batch" });
      } catch (err) {
        logger.error(
          { err },
          "Legacy DELETE /batches/:id/student/:studentId failed",
        );
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // ── Subjects based on student (GET /subjects/based-on-student/:id) ──
  // ── Subjects list — resolve addedBy userId → full name ──
  gateway.get("/subjects", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const docs = await db
        .collection("subjects")
        .find({ tenantId })
        .sort({ createdAt: -1 })
        .toArray();
      const userNameMap = await resolveUserNames(
        db,
        docs.map((d: any) => d.addedBy),
      );
      // Also resolve course refs for legacy `course` populated object
      const courseIds = [
        ...new Set(
          docs.map((d: any) => d.courseId || d.course).filter(Boolean),
        ),
      ];
      const courseMap = new Map<string, any>();
      if (courseIds.length > 0) {
        const { ObjectId } = await import("mongodb");
        const oids = courseIds
          .map((id: string) => {
            try {
              return new ObjectId(id);
            } catch {
              return null;
            }
          })
          .filter((v): v is InstanceType<typeof ObjectId> => v !== null);
        if (oids.length > 0) {
          const courses = await db
            .collection("courses")
            .find({ _id: { $in: oids } })
            .toArray();
          for (const c of courses) courseMap.set(c._id.toString(), c);
        }
      }
      res.json(
        docs.map((d: any) => {
          const cId = d.courseId || d.course || "";
          const course = courseMap.get(cId);
          return {
            _id: d._legacyId || d._id.toString(),
            subjectName: d.subjectName || "",
            subjectCode: d.subjectCode || "",
            fullMarks: d.fullMarks ?? 0,
            passMarks: d.passMarks ?? 0,
            semYear: d.semYear || "",
            course: course
              ? {
                  _id: course._legacyId || course._id.toString(),
                  courseName: course.name || course.courseName || "",
                }
              : cId,
            courseType: d.courseType || "",
            addedBy:
              userNameMap.get(d.addedBy) || d.addedBy || d.createdBy || "",
            createdAt: d.createdAt,
            updatedAt: d.updatedAt || d.createdAt,
            __v: 0,
          };
        }),
      );
    } catch (err) {
      logger.error({ err }, "Legacy GET /subjects failed");
      res.json([]);
    }
  });

  // Legacy queries: studentSubjectMarksModel.find({ studentInfo: studentId }).populate('subjects.subject')
  // Frontend expects: { data: [{ _id, course, subjects: [{ subject: { _id, subjectName, subjectCode, fullMarks, passMarks } }] }] }
  gateway.get(
    "/subjects/based-on-student/:id",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json({ data: [] });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const studentId = p(req, "id");

        // Find student by _id or _legacyId to get all possible IDs
        const studentOr: any[] = [{ _legacyId: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId))
          studentOr.push({ _id: new mongoose.Types.ObjectId(studentId) });
        const student = await db
          .collection("students")
          .findOne({ $or: studentOr, tenantId });

        // Build all possible student ID variants to match studentmarks.studentId
        const studentIdVariants: string[] = [studentId];
        if (student) {
          studentIdVariants.push(student._id.toString());
          if (student._legacyId) studentIdVariants.push(student._legacyId);
        }

        // Query studentmarks collection (legacy: studentSubjectMarksModel.find({ studentInfo: studentId }))
        const marks = await db
          .collection("studentmarks")
          .find({ tenantId, studentId: { $in: studentIdVariants } })
          .toArray();

        if (marks.length > 0) {
          // Build subject lookup map
          const allSubjects = await db
            .collection("subjects")
            .find({ tenantId })
            .toArray();
          const subjectById = new Map<string, any>();
          allSubjects.forEach((s) => {
            subjectById.set(s._id.toString(), s);
            if (s._legacyId) subjectById.set(s._legacyId, s);
          });

          // Build course lookup map
          const courseIds = [
            ...new Set(
              marks
                .map((m) => m.courseId)
                .filter(Boolean)
                .map(String),
            ),
          ];
          const courseOr: any[] = [];
          courseIds.forEach((cid) => {
            courseOr.push({ _legacyId: cid });
            if (mongoose.Types.ObjectId.isValid(cid))
              courseOr.push({ _id: new mongoose.Types.ObjectId(cid) });
          });
          const courses = courseOr.length
            ? await db
                .collection("courses")
                .find({ tenantId, $or: courseOr })
                .toArray()
            : [];
          const courseById = new Map<string, any>();
          courses.forEach((c) => {
            courseById.set(c._id.toString(), c);
            if (c._legacyId) courseById.set(c._legacyId, c);
          });

          // Build subject-by-name map (courseId → Map<lowerName, subDoc>) for name-based resolution
          const subjectByCourseName = new Map<string, Map<string, any>>();
          allSubjects.forEach((s) => {
            const cid = s.courseId ? String(s.courseId) : "__none__";
            if (!subjectByCourseName.has(cid))
              subjectByCourseName.set(cid, new Map());
            if (s.subjectName)
              subjectByCourseName.get(cid)!.set(s.subjectName.toLowerCase(), s);
          });

          function resolveSubject(sub: any, courseLegacyId?: string): any {
            // Try by subject ObjectId ref first
            if (sub.subject) {
              const subDoc = subjectById.get(String(sub.subject));
              if (subDoc) return subDoc;
            }
            // Fallback: resolve by subjectName with course preference
            if (sub.subjectName) {
              const lname = sub.subjectName.toLowerCase();
              if (courseLegacyId) {
                const courseMap = subjectByCourseName.get(courseLegacyId);
                if (courseMap?.has(lname)) return courseMap.get(lname);
              }
              // Try any course
              for (const [, nameMap] of subjectByCourseName) {
                if (nameMap.has(lname)) return nameMap.get(lname);
              }
            }
            return null;
          }

          // Map marks to frontend format
          const data = marks.map((m) => {
            const course = m.courseId
              ? courseById.get(String(m.courseId)) || null
              : null;
            const courseLegacyId =
              course?._legacyId ||
              (m.courseId ? String(m.courseId) : undefined);
            const subjects = Array.isArray(m.subjects)
              ? m.subjects
                  .map((sub: any) => {
                    const subDoc = resolveSubject(sub, courseLegacyId);
                    const subjectObj = subDoc
                      ? {
                          _id: subDoc._legacyId || subDoc._id.toString(),
                          subjectName: subDoc.subjectName || "",
                          subjectCode:
                            subDoc.subjectCode || sub.subjectCode || "",
                          fullMarks:
                            subDoc.fullMarks || subDoc.theoryMarks || 0,
                          passMarks: subDoc.passMarks || 0,
                        }
                      : sub.subjectName
                        ? {
                            _id: sub.subjectName,
                            subjectName: sub.subjectName,
                            subjectCode: sub.subjectCode || "",
                            fullMarks: 0,
                            passMarks: 0,
                          }
                        : null;
                    return {
                      subject: subjectObj,
                      theory: sub.theory,
                      practical: sub.practical,
                      totalMarks: sub.totalMarks,
                      isActive: sub.isActive ?? true,
                    };
                  })
                  .filter((s: any) => s.subject)
              : [];

            return {
              _id: m._legacyId || m._id.toString(),
              studentInfo: student
                ? {
                    _id: student._legacyId || student._id.toString(),
                    name: [student.firstName, student.lastName]
                      .filter(Boolean)
                      .join(" "),
                  }
                : null,
              course: course
                ? {
                    _id: course._legacyId || course._id.toString(),
                    courseName: course.name || "",
                  }
                : null,
              categoryId: m.categoryId || null,
              companyId: m.companyId || null,
              subjects,
            };
          });

          res.json({ success: true, data });
          return;
        }

        // Fallback: no studentmarks found — return course subjects instead
        if (!student?.enrollment?.courseId) {
          res.json({ data: [] });
          return;
        }
        const courseId = student.enrollment.courseId.toString();
        let course: any = null;
        try {
          const courseOid = new mongoose.Types.ObjectId(courseId);
          course = await db.collection("courses").findOne({
            $or: [{ _id: courseOid }, { _legacyId: courseId }],
            tenantId,
          });
        } catch {
          course = await db
            .collection("courses")
            .findOne({ _legacyId: courseId, tenantId });
        }
        if (!course) {
          res.json({ data: [] });
          return;
        }

        const courseLegacyId = course._legacyId || course._id.toString();
        let courseSubjects = await db
          .collection("subjects")
          .find({
            tenantId,
            courseId: { $in: [courseLegacyId, course._id.toString()] },
          })
          .toArray();

        if (
          courseSubjects.length === 0 &&
          Array.isArray(course.subjects) &&
          course.subjects.length > 0
        ) {
          const allSubs = await db
            .collection("subjects")
            .find({ tenantId })
            .toArray();
          const nameMap = new Map<string, any>();
          allSubs.forEach((s) => {
            if (s.subjectName) nameMap.set(s.subjectName.toLowerCase(), s);
          });
          courseSubjects = course.subjects.map(
            (s: any) =>
              nameMap.get((s.name || "").toLowerCase()) || {
                _id: s.name,
                subjectName: s.name,
              },
          );
        }

        res.json({
          data: [
            {
              _id: course._legacyId || course._id.toString(),
              category: course.category || course.name,
              subjects: courseSubjects.map((s: any) => ({
                subject: {
                  _id: s._legacyId || s._id?.toString() || s.subjectName,
                  subjectName: s.subjectName || "",
                },
              })),
            },
          ],
        });
      } catch (err) {
        logger.error({ err }, "Legacy subjects/based-on-student GET failed");
        res.json({ data: [] });
      }
    },
  );

  // ── Course fees payment (POST /courseFees) — legacy field names → raw MongoDB insert ──
  // Frontend sends: { studentInfo, remainingFees, amountPaid, narration, amountDate, lateFees, paymentOption }
  // ── DELETE /courseFees/:id — delete fee payment and recalculate student totals ──
  gateway.delete("/courseFees/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const { ObjectId } = await import("mongodb");
      const db = mongoose.connection.db!;
      const feeId = p(req, "id");

      // Find the fee in both collections
      const orClauses: any[] = [{ _legacyId: feeId }];
      if (mongoose.Types.ObjectId.isValid(feeId))
        orClauses.push({ _id: new ObjectId(feeId) });

      const legacyFee = await db
        .collection("coursefees")
        .findOne({ $or: orClauses });
      const newFee = await db
        .collection("feepayments")
        .findOne({ tenantId, $or: orClauses });
      const fee = legacyFee || newFee;

      if (!fee) {
        res.status(404).json({ message: "Fee payment not found" });
        return;
      }

      // Get student ID from the fee
      const studentRef = String(fee.studentId || fee.studentInfo || "");

      // Delete the fee record from whichever collection it's in
      if (legacyFee)
        await db.collection("coursefees").deleteOne({ _id: legacyFee._id });
      if (newFee)
        await db.collection("feepayments").deleteOne({ _id: newFee._id });

      // Delete related daybook entry
      if (fee.receiptNumber || fee.reciptNumber) {
        await db.collection("daybookentries").deleteMany({
          tenantId,
          $or: [
            { receiptNumber: fee.receiptNumber || fee.reciptNumber },
            { reciptNumber: fee.receiptNumber || fee.reciptNumber },
          ],
        });
      }

      // Recalculate student totals from ALL remaining payments in BOTH collections
      if (studentRef) {
        const studentOrClauses: any[] = [{ _legacyId: studentRef }];
        if (mongoose.Types.ObjectId.isValid(studentRef))
          studentOrClauses.push({ _id: new ObjectId(studentRef) });
        const student = await db.collection("students").findOne({
          $and: [
            { $or: [{ tenantId }, { tenantId: { $exists: false } }] },
            { $or: studentOrClauses },
          ],
        });

        if (student) {
          const stuId = student._id.toString();
          const stuLegacyId = student._legacyId
            ? String(student._legacyId)
            : null;
          const allIds = [stuId, stuLegacyId].filter(Boolean);
          const allOids = allIds
            .filter((id) => mongoose.Types.ObjectId.isValid(id as string))
            .map((id) => new ObjectId(id as string));

          // Sum payments from both collections
          const [remainingLegacy, remainingNew] = await Promise.all([
            db
              .collection("coursefees")
              .find({
                $or: [
                  { studentInfo: { $in: allOids } },
                  { studentId: { $in: allIds } },
                ],
              })
              .toArray(),
            db
              .collection("feepayments")
              .find({
                tenantId,
                $or: [
                  { studentInfo: { $in: [...allIds, ...allOids] } },
                  { studentId: { $in: allIds } },
                ],
              })
              .toArray(),
          ]);

          const totalPaid = [...remainingLegacy, ...remainingNew].reduce(
            (sum, p) => sum + (Number(p.amountPaid) || 0),
            0,
          );
          const enrollment = Array.isArray(student.enrollment)
            ? student.enrollment[0]
            : student.enrollment;
          const netFees = enrollment?.netFees ?? student.netCourseFees ?? 0;
          const remainingFees = netFees - totalPaid;

          // Update both DDD enrollment and legacy flat fields
          const updateFields: any = {
            totalPaid,
            remainingCourseFees: remainingFees,
            updatedAt: new Date(),
          };
          if (enrollment) {
            updateFields.enrollment = {
              ...enrollment,
              totalPaid,
              remainingFees,
            };
          }

          await db
            .collection("students")
            .updateOne({ _id: student._id }, { $set: updateFields });
        }
      }

      logger.info(
        { feeId, studentRef, totalPaid: "recalculated" },
        "DEBUG: DELETE /courseFees/:id success",
      );
      res.json({ message: "Fee payment deleted successfully" });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /courseFees/:id failed");
      res.status(500).json({ message: "Error deleting fee payment" });
    }
  });

  gateway.post("/courseFees", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const body = req.body as any;

      if (!body.amountPaid || !body.studentInfo) {
        res
          .status(400)
          .json({ success: false, message: "Required fields are missing" });
        return;
      }

      // Find student
      const studentOr: any[] = [{ _legacyId: body.studentInfo }];
      if (mongoose.Types.ObjectId.isValid(body.studentInfo))
        studentOr.push({ _id: new mongoose.Types.ObjectId(body.studentInfo) });
      const student = await db
        .collection("students")
        .findOne({ tenantId, $or: studentOr });
      if (!student) {
        res.status(404).json({ success: false, message: "Student not found" });
        return;
      }

      const enrollment = student.enrollment || {};
      const amountPaid = Number(body.amountPaid) || 0;
      const lateFees = Number(body.lateFees) || 0;
      const currentRemaining = Number(
        enrollment.remainingFees ?? student.remainingCourseFees ?? 0,
      );
      const newRemaining = currentRemaining - amountPaid;
      const currentTotalPaid = Number(
        enrollment.totalPaid ?? student.totalPaid ?? 0,
      );

      const rawCompanyId =
        student.companyName || student.enrollment?.companyId || null;
      const companyId = normalizeCompanyId(rawCompanyId);

      let companyPrefix: string | undefined;
      if (companyId) {
        const companyOrClauses: any[] = [{ _legacyId: companyId }];
        if (mongoose.Types.ObjectId.isValid(companyId)) {
          companyOrClauses.push({
            _id: new mongoose.Types.ObjectId(companyId),
          });
        }
        const company = await db
          .collection("batchcategories")
          .findOne({ tenantId, $or: companyOrClauses });
        if (company?.reciptNumber) {
          companyPrefix = String(company.reciptNumber).trim();
        }
      }

      // Generate receipt number
      const receiptCounterRepo = new MongoReceiptCounterRepository();
      const tenantRepo = new MongoTenantRepository();
      const getNextReceiptUseCase = new GetNextReceiptNumber(
        receiptCounterRepo,
        tenantRepo,
      );
      let receiptResult = await getNextReceiptUseCase.execute({
        tenantId,
        companyPrefix,
      });
      let receiptNumber = receiptResult.receiptNumber;

      // Skip any stale duplicate receiptNumber values
      while (
        await db.collection("feepayments").findOne({
          tenantId,
          receiptNumber,
        })
      ) {
        receiptResult = await receiptCounterRepo.incrementAndGet(tenantId);
        receiptNumber = receiptResult.receiptNumber;
      }

      // Ensure receiptNumber is not null
      if (!receiptNumber) {
        receiptNumber = `VM-${Date.now()}`;
      }

      const now = new Date();
      const feeDoc = {
        tenantId,
        studentInfo: body.studentInfo,
        studentId: student._id.toString(),
        StudentName:
          student.name ||
          [student.firstName, student.lastName].filter(Boolean).join(" "),
        rollNo: student.rollNumber || "",
        amountPaid,
        remainingFees: newRemaining,
        narration: body.narration || "",
        amountDate: body.amountDate || now.toISOString(),
        paymentDate: body.amountDate || now.toISOString(),
        lateFees,
        paymentOption: body.paymentOption || "",
        receiptNumber,
        companyId,
        courseId: enrollment.courseId || null,
        createdBy: (req as any).user?.userId || "system",
        addedBy: (req as any).user?.userId || "system",
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.collection("feepayments").insertOne(feeDoc);

      // Calculate next installment due date
      const installmentCount = Number(
        enrollment.installmentCount ?? student.no_of_installments ?? 0,
      );
      const installmentAmount = Number(
        enrollment.installmentAmount ?? student.no_of_installments_amount ?? 0,
      );
      const studentUpdateFields: any = {
        "enrollment.remainingFees": newRemaining,
        "enrollment.totalPaid": currentTotalPaid + amountPaid,
        remainingCourseFees: newRemaining,
        totalPaid: currentTotalPaid + amountPaid,
        updatedAt: now,
      };

      if (newRemaining <= 0) {
        // Fully paid — clear installment expiry
        studentUpdateFields.no_of_installments_expireTimeandAmount = null;
      } else if (installmentCount > 0) {
        // Calculate next installment expiration date (1 month from payment date)
        const paymentDate = new Date(body.amountDate || now);
        const nextDueDate = new Date(paymentDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        studentUpdateFields.no_of_installments_expireTimeandAmount =
          nextDueDate;
        studentUpdateFields.no_of_installments_amount =
          installmentAmount ||
          Math.ceil(newRemaining / Math.max(installmentCount - 1, 1));

        // Also update installment_duration for late fee calculation on frontend
        studentUpdateFields.installment_duration = nextDueDate;

        // Create installment tracking record
        await db.collection("paymentinstallmenttimes").insertOne({
          tenantId,
          studentInfo: student._id,
          companyName: student.companyName || null,
          courseName: enrollment.courseId || student.courseName || null,
          expiration_date: nextDueDate,
          installment_number: installmentCount,
          installment_amount:
            installmentAmount ||
            Math.ceil(newRemaining / Math.max(installmentCount - 1, 1)),
          dropOutStudent: false,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Update student remaining fees and total paid
      await db
        .collection("students")
        .updateOne({ _id: student._id }, { $set: studentUpdateFields });

      res.status(200).json({
        success: true,
        message: "Course fees paid successfully",
        _id: result.insertedId.toString(),
        id: student._legacyId || student._id.toString(),
        studentId: student._legacyId || student._id.toString(),
        receiptNumber,
        remainingFees: newRemaining,
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /courseFees failed");
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  // ── Subject marks email (POST /subjects/subject-mail) ──
  gateway.post(
    "/subjects/subject-mail",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }
        const body = req.body as any;
        const subjectData = body.subjectData;
        const studentData = subjectData?.studentData || body.studentData;

        if (!studentData?.email) {
          res.json({ success: true, message: "No student email — skipped" });
          return;
        }

        const subjects = subjectData?.subjectData?.data?.[0]?.subjects || [];
        const subjectRows = subjects
          .map(
            (s: any) =>
              `<tr><td>${s.subject?.subjectName || ""}</td><td>${s.subject?.subjectCode || ""}</td><td>${s.theory ?? "-"}</td><td>${s.practical ?? "-"}</td><td>${s.totalMarks ?? "-"}</td><td>${s.subject?.fullMarks || ""}</td></tr>`,
          )
          .join("");

        try {
          const { EmailService } = await import("../email/EmailService.js");
          const emailService = new EmailService();
          await emailService.send({
            to: studentData.email,
            subject: `Subject Marks Report - ${studentData.name || "Student"}`,
            html: `<div style="font-family:Arial;max-width:700px;margin:0 auto;padding:20px;">
            <h2>Subject Marks Report</h2>
            <p>Student: <strong>${studentData.name || ""}</strong></p>
            <p>Roll No: ${studentData.rollNumber || ""}</p>
            <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;">
              <thead><tr><th>Subject</th><th>Code</th><th>Theory</th><th>Practical</th><th>Total</th><th>Max Marks</th></tr></thead>
              <tbody>${subjectRows || '<tr><td colspan="6">No subjects</td></tr>'}</tbody>
            </table></div>`,
            tenantId,
          });
          logger.info({ email: studentData.email }, "Subject marks email sent");
        } catch (emailErr) {
          logger.error({ emailErr }, "Failed to send subject marks email");
        }

        res.json({ success: true, message: "Email sent successfully" });
      } catch (err) {
        logger.error({ err }, "Legacy POST /subjects/subject-mail failed");
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    },
  );

  // ── Send course change email (POST /students/sendCourseChangeEmail) ──
  // Frontend sends: { userIds: [studentId], newCourse: "...", company: { companyName, email } }
  // For now, accept and log — actual email sending requires Nodemailer setup
  gateway.post(
    "/students/sendCourseChangeEmail",
    async (req: Request, res: Response) => {
      try {
        const body = req.body as any;
        logger.info(
          { userIds: body.userIds, newCourse: body.newCourse },
          "Course change email requested (not yet implemented)",
        );
        res.json({
          success: true,
          message: "Course change notification logged",
        });
      } catch (err) {
        logger.error({ err }, "Legacy sendCourseChangeEmail failed");
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    },
  );

  // PUT /students/:id — explicit handler registered later in file (properly merges enrollment/contact)

  // ── Student search (GET /students/search?q=...) ──
  gateway.get("/students/search", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const q = (req.query.q || req.query.search || "") as string;
      if (!q) {
        res.json([]);
        return;
      }

      const regex = new RegExp(q, "i");
      const students = await mongoose.connection
        .db!.collection("students")
        .find({
          tenantId,
          $or: [
            { firstName: regex },
            { lastName: regex },
            { name: regex },
            { "contact.email": regex },
            { "contact.mobile": regex },
            { rollNumber: regex },
          ],
        })
        .limit(50)
        .toArray();

      const courseMap = await loadCourseMap(tenantId);
      res.json(students.map((s: any) => mapStudentToLegacy(s, courseMap)));
    } catch (err) {
      logger.error({ err }, "Legacy student search failed");
      res.json([]);
    }
  });

  // ── Student fees collection report (GET /students/feesCollection) ──
  gateway.get(
    "/students/feesCollection",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;

        // Aggregate fee payments from both legacy and new collections
        const [newFees, legacyFees] = await Promise.all([
          db
            .collection("feepayments")
            .find({ tenantId })
            .sort({ paymentDate: -1 })
            .toArray(),
          db
            .collection("coursefees")
            .find({ $or: [{ tenantId }, { tenantId: { $exists: false } }] })
            .sort({ createdAt: -1 })
            .toArray(),
        ]);
        const fees = [...newFees, ...legacyFees];

        res.json(
          fees.map((f: any) => ({
            _id: f._legacyId || f._id.toString(),
            studentId: f.studentId ? String(f.studentId) : null,
            StudentName: f.StudentName || f.studentName || "",
            rollNo: f.rollNo || f.rollNumber || "",
            amount: Number(f.amount) || 0,
            paymentDate: f.paymentDate || f.createdAt,
            paymentOption: f.paymentOption || "",
            narration: f.narration || "",
            reciptNumber: f.reciptNumber || f.receiptNumber || "",
            companyId: f.companyId ? String(f.companyId) : null,
            createdAt: f.createdAt,
          })),
        );
      } catch (err) {
        logger.error({ err }, "Legacy student feesCollection failed");
        res.json([]);
      }
    },
  );

  gateway.get("/students/commission", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      await fetchCommissionsLegacy(
        tenantId,
        res,
        req.query.studentName as string | undefined,
      );
    } catch (err) {
      logger.error({ err }, "Legacy commission query failed");
      res.json([]);
    }
  });

  gateway.get(
    "/students/commissionList",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        await fetchCommissionsLegacy(
          tenantId,
          res,
          req.query.studentName as string | undefined,
        );
      } catch (err) {
        logger.error({ err }, "Legacy commissionList query failed");
        res.json([]);
      }
    },
  );

  // ── Commission create ──
  // Explicit handler (not the DDD proxy) so we persist companyId + narration:
  // the daybook total filters rows by companyId, so a commission without one
  // would never count against a company's revenue. The frontend already sends
  // companyId (the student's company) and the note as "commissionNaretion".
  function resolveUserName(req: Request): string {
    return (
      [(req as any).user?.firstName, (req as any).user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "app"
    );
  }

  gateway.post("/students/commission", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const b = req.body as any;
      const studentName = String(b.studentName || "").trim();
      const commissionPersonName = String(b.commissionPersonName || "").trim();
      if (!studentName || !commissionPersonName) {
        res
          .status(400)
          .json({ message: "studentName and commissionPersonName are required" });
        return;
      }
      const commissionAmount = Number(b.commissionAmount) || 0;
      const commissionPaid = Number(b.commissionPaid) || 0;
      const { default: mongoose } = await import("mongoose");
      const now = new Date();
      const doc: Record<string, any> = {
        tenantId,
        studentName,
        commissionPersonName,
        voucherNumber: b.voucherNumber ? String(b.voucherNumber) : "",
        commissionAmount,
        commissionPaid,
        commissionRemaining: commissionAmount - commissionPaid,
        commissionDate: b.commissionDate ? new Date(b.commissionDate) : now,
        narration: String(b.narration ?? b.commissionNaretion ?? ""),
        companyId: b.companyId ? String(b.companyId) : null,
        dayBookAccountId: b.dayBookAccountId ? String(b.dayBookAccountId) : "",
        createdBy: resolveUserName(req),
        createdAt: now,
        updatedAt: now,
      };
      const result = await mongoose.connection
        .db!.collection("commissions")
        .insertOne(doc);
      res
        .status(201)
        .json({ success: true, data: { _id: result.insertedId.toString(), ...doc } });
    } catch (err) {
      logger.error({ err }, "Legacy POST /students/commission failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Commission update (legacy ID support; recomputes remaining) ──
  gateway.put("/students/commission/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = String(req.params.id);
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const coll = mongoose.connection.db!.collection("commissions");
      const existing = await coll.findOne({ tenantId, $or: orClauses });
      if (!existing) {
        res.status(404).json({ message: "Commission not found" });
        return;
      }
      const b = req.body as any;
      const set: Record<string, any> = { updatedAt: new Date() };
      if (b.studentName !== undefined) set.studentName = String(b.studentName);
      if (b.commissionPersonName !== undefined)
        set.commissionPersonName = String(b.commissionPersonName);
      if (b.voucherNumber !== undefined) set.voucherNumber = String(b.voucherNumber);
      if (b.commissionDate !== undefined) set.commissionDate = new Date(b.commissionDate);
      if (b.narration !== undefined || b.commissionNaretion !== undefined)
        set.narration = String(b.narration ?? b.commissionNaretion ?? "");
      if (b.companyId !== undefined) set.companyId = b.companyId ? String(b.companyId) : null;
      const amount =
        b.commissionAmount !== undefined
          ? Number(b.commissionAmount) || 0
          : Number(existing.commissionAmount) || 0;
      const paid =
        b.commissionPaid !== undefined
          ? Number(b.commissionPaid) || 0
          : Number(existing.commissionPaid) || 0;
      set.commissionAmount = amount;
      set.commissionPaid = paid;
      set.commissionRemaining = amount - paid;
      await coll.updateOne({ _id: existing._id }, { $set: set });
      res.json({
        success: true,
        data: { ...existing, ...set, _id: existing._legacyId || existing._id.toString() },
      });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /students/commission/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Commission delete (legacy ID support) ──
  gateway.delete("/students/commission/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = String(req.params.id);
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await mongoose.connection
        .db!.collection("commissions")
        .deleteOne({ tenantId, $or: orClauses });
      if (result.deletedCount === 0) {
        res.status(404).json({ message: "Commission not found" });
        return;
      }
      res.json({ success: true, message: "Commission deleted" });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /students/commission/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Course fees by student ID (raw coursefees collection with populated paymentOption) ──
  // Frontend expects: plain array with paymentOption as { _id, name, ... } object
  // ── All Course Fees (monthly report data) ──
  // Legacy: GET /api/courseFees/allCourseFess → plain array of fee payment records with populated studentInfo, courseName
  gateway.get(
    "/courseFees/allCourseFess",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;

        // Query both legacy coursefees and new feepayments
        // Legacy coursefees may not have tenantId (pre-migration data)
        const [legacyFees, newFees] = await Promise.all([
          db
            .collection("coursefees")
            .find({ $or: [{ tenantId }, { tenantId: { $exists: false } }] })
            .sort({ createdAt: -1 })
            .toArray(),
          db
            .collection("feepayments")
            .find({ tenantId })
            .sort({ paymentDate: -1 })
            .toArray(),
        ]);
        const fees = [...legacyFees, ...newFees];

        // Collect student/course IDs for population
        const studentIds = [
          ...new Set(
            fees
              .map((f: any) => String(f.studentId || f.studentInfo))
              .filter(Boolean),
          ),
        ];
        const courseIds = [
          ...new Set(
            fees
              .map((f: any) => String(f.courseId || f.courseName))
              .filter(Boolean),
          ),
        ];

        // Build student map
        const stuMap = new Map<string, any>();
        if (studentIds.length) {
          const stuOr: any[] = [];
          studentIds.forEach((id) => {
            stuOr.push({ _legacyId: id });
            if (mongoose.Types.ObjectId.isValid(id))
              stuOr.push({ _id: new mongoose.Types.ObjectId(id) });
          });
          const stuDocs = await db
            .collection("students")
            .find({
              $and: [
                { $or: [{ tenantId }, { tenantId: { $exists: false } }] },
                { $or: stuOr },
              ],
            })
            .toArray();
          stuDocs.forEach((s: any) => {
            stuMap.set(s._id.toString(), s);
            if (s._legacyId) stuMap.set(String(s._legacyId), s);
          });
        }

        // Build course map
        const courseMap = new Map<string, any>();
        if (courseIds.length) {
          const cOr: any[] = [];
          courseIds.forEach((id) => {
            cOr.push({ _legacyId: id });
            if (mongoose.Types.ObjectId.isValid(id))
              cOr.push({ _id: new mongoose.Types.ObjectId(id) });
          });
          const cDocs = await db
            .collection("courses")
            .find({
              $and: [
                { $or: [{ tenantId }, { tenantId: { $exists: false } }] },
                { $or: cOr },
              ],
            })
            .toArray();
          cDocs.forEach((c: any) => {
            courseMap.set(c._id.toString(), c);
            if (c._legacyId) courseMap.set(String(c._legacyId), c);
          });
        }

        // Build company map: resolve any company ref → canonical ID (legacyId preferred, matches GET /company)
        const companyDocs = await db
          .collection("batchcategories")
          .find({ $or: [{ tenantId }, { tenantId: { $exists: false } }] })
          .toArray();
        const companyIdMap = new Map<string, string>();
        for (const comp of companyDocs) {
          const canonicalId = comp._legacyId ? String(comp._legacyId) : comp._id.toString();
          companyIdMap.set(comp._id.toString(), canonicalId);
          if (comp._legacyId)
            companyIdMap.set(String(comp._legacyId), canonicalId);
        }

        const mapped = fees.map((f: any) => {
          const stu =
            stuMap.get(String(f.studentId || f.studentInfo)) ||
            stuMap.get(String(f.studentInfo)) ||
            null;
          const course =
            courseMap.get(String(f.courseId || f.courseName)) ||
            courseMap.get(String(f.courseName)) ||
            null;
          const enrollment = Array.isArray(stu?.enrollment)
            ? stu.enrollment[0]
            : stu?.enrollment;
          const rawCompanyId =
            enrollment?.companyId || stu?.companyName || f.companyName || null;
          const companyId = rawCompanyId
            ? companyIdMap.get(String(rawCompanyId)) || String(rawCompanyId)
            : null;
          return {
            _id: f._legacyId || f._id.toString(),
            studentInfo: stu
              ? {
                  _id: stu._legacyId || stu._id.toString(),
                  name: stu.firstName
                    ? [stu.firstName, stu.lastName].filter(Boolean).join(" ")
                    : stu.name || "",
                  rollNumber: stu.rollNumber || "",
                  companyName: companyId ? String(companyId) : null,
                  date_of_joining:
                    enrollment?.dateOfJoining || stu.date_of_joining || null,
                  dropOutStudent:
                    stu.status === "dropout" || (stu.dropOutStudent ?? false),
                  createdAt: stu.createdAt,
                }
              : f.studentId || null,
            courseName: course
              ? {
                  _id: course._legacyId || course._id.toString(),
                  courseName: course.name || course.courseName || "",
                  courseFees: course.fees || course.courseFees || 0,
                  category: course.category || null,
                }
              : f.courseId || null,
            companyName: companyId ? String(companyId) : null,
            amountPaid: Number(f.amountPaid) || 0,
            amountDate: f.amountDate || f.paymentDate || f.createdAt,
            remainingFees: Number(f.remainingFees) || 0,
            narration: f.narration || "",
            reciptNumber: f.receiptNumber || f.reciptNumber || "",
            lateFees: Number(f.lateFees) || 0,
            no_of_installments: f.no_of_installments || 0,
            no_of_installments_amount: f.no_of_installments_amount || 0,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt || f.createdAt,
            __v: 0,
          };
        });
        res.json(mapped);
      } catch (err) {
        logger.error({ err }, "Legacy GET /courseFees/allCourseFess failed");
        res.json([]);
      }
    },
  );

  // ── Not Paid Students (monthly collection report) ──
  // Legacy: POST /api/courseFees/get-not-paid-students → { notPaidStudents: [...] }
  gateway.post(
    "/courseFees/get-not-paid-students",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json({ notPaidStudents: [] });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        // Note: toDate / fromDate from body are ignored to match prod legacy behavior
        const { companyId } = req.body as any;

        // Resolve companyId to all possible variants (current + legacy)
        const companyVariants: any[] = companyId ? [companyId] : [];
        if (companyId) {
          try {
            const { ObjectId } = await import("mongodb");
            if (mongoose.Types.ObjectId.isValid(companyId)) {
              companyVariants.push(new ObjectId(companyId));
              const compDoc = await db
                .collection("batchcategories")
                .findOne({ _id: new ObjectId(companyId) });
              if (compDoc?._legacyId) {
                companyVariants.push(String(compDoc._legacyId));
                if (mongoose.Types.ObjectId.isValid(String(compDoc._legacyId)))
                  companyVariants.push(new ObjectId(String(compDoc._legacyId)));
              }
            }
          } catch {
            /* ignore */
          }
        }

        // Get all active students for company with remaining fees.
        // Exclude dropouts (handle BOTH the DDD `status: "dropout"` and legacy `dropOutStudent: true`)
        const stuQuery: any = {
          $or: [{ tenantId }, { tenantId: { $exists: false } }],
          $nor: [
            { status: { $in: ["dropout", "dropped"] } },
            { dropOutStudent: true },
          ],
        };
        if (companyVariants.length) {
          stuQuery.$and = [
            {
              $or: [
                { "enrollment.companyId": { $in: companyVariants } },
                { companyName: { $in: companyVariants } },
              ],
            },
          ];
        }
        const students = await db
          .collection("students")
          .find(stuQuery)
          .toArray();
        // Debug: log sample student with ALL fee-related fields
        const s0 = students[0];
        logger.info(
          {
            tenantId,
            companyId,
            companyVariants: companyVariants.map(String),
            studentsFound: students.length,
            sampleStudentKeys: s0 ? Object.keys(s0).join(",") : null,
            sampleStudent: s0
              ? {
                  _id: s0._id,
                  name: s0.name || s0.firstName,
                  remainingCourseFees: s0.remainingCourseFees,
                  remainingFees: s0.remainingFees,
                  netCourseFees: s0.netCourseFees,
                  totalPaid: s0.totalPaid,
                  enrollment: s0.enrollment,
                  no_of_installments: s0.no_of_installments,
                  installmentAmount: s0.installmentAmount,
                  no_of_installments_expireTimeandAmount:
                    s0.no_of_installments_expireTimeandAmount,
                }
              : null,
          },
          "DEBUG: get-not-paid-students",
        );

        const notPaidStudents: any[] = [];
        const now = new Date();
        let debugSkippedNoFees = 0;
        let debugSkippedDate = 0;
        let debugAdded = 0;

        for (const stu of students) {
          // enrollment can be an object (DDD) or array (legacy) or undefined
          const enrollment = Array.isArray(stu.enrollment)
            ? stu.enrollment[0]
            : stu.enrollment;
          const remainingFees =
            enrollment?.remainingFees ??
            enrollment?.remainingCourseFees ??
            stu.remainingCourseFees ??
            stu.remainingFees ??
            0;
          if (remainingFees <= 0) {
            debugSkippedNoFees++;
            continue;
          }

          // ── Match prod legacy logic exactly (controllers/courseFees.controllers.js) ──
          // Find latest payment by createdAt (sort desc, take first)
          const stuId = stu._legacyId || stu._id.toString();
          const studentIdVariants = [
            stuId,
            stu._id.toString(),
            stu._legacyId,
          ].filter(Boolean);
          const studentOidVariants = studentIdVariants
            .filter((id) => mongoose.Types.ObjectId.isValid(id as string))
            .map((id) => new mongoose.Types.ObjectId(id as string));
          const lastPayment =
            (await db
              .collection("feepayments")
              .findOne(
                { tenantId, studentId: { $in: studentIdVariants } },
                { sort: { createdAt: -1 } },
              )) ||
            (await db.collection("coursefees").findOne(
              {
                $or: [
                  { studentInfo: { $in: studentOidVariants } },
                  { studentId: { $in: studentIdVariants } },
                ],
              },
              { sort: { createdAt: -1 } },
            ));

          // Prod logic: SKIP students with NO payments at all (line 76-77)
          if (!lastPayment) {
            debugSkippedNoFees++;
            continue;
          }

          const latestDate = new Date(lastPayment.createdAt);

          // Prod logic: month-diff math, not day-based
          // unpaidMonthsBeforeCurrentMonth = (currYear - paidYear) * 12 + (currMonth - paidMonth)
          const missingMonths =
            (now.getFullYear() - latestDate.getFullYear()) * 12 +
            (now.getMonth() - latestDate.getMonth());

          // Prod logic: only include if missingMonths > 0
          if (missingMonths <= 0) {
            debugSkippedDate++;
            continue;
          }

          // (Note: prod ignores fromDate/toDate entirely — they're only validated for presence)

          // Resolve course ID (frontend uses courseIdToName[courseName] for display)
          const courseId = enrollment?.courseId
            ? String(enrollment.courseId)
            : null;
          let courseIdLegacy = courseId || "";
          if (courseId) {
            const cOr: any[] = [{ _legacyId: courseId }];
            if (mongoose.Types.ObjectId.isValid(courseId))
              cOr.push({ _id: new mongoose.Types.ObjectId(courseId) });
            const course = await db
              .collection("courses")
              .findOne({ tenantId, $or: cOr });
            if (course)
              courseIdLegacy = course._legacyId || course._id.toString();
          }

          debugAdded++;
          notPaidStudents.push({
            _id: stu._legacyId || stu._id.toString(),
            name: stu.firstName
              ? [stu.firstName, stu.lastName].filter(Boolean).join(" ")
              : stu.name || "",
            rollNumber: stu.rollNumber || "",
            mobile_number: stu.contact?.mobile || stu.mobile_number || "",
            courseName: courseIdLegacy,
            remainingCourseFees: remainingFees,
            no_of_installments_amount: enrollment?.installmentAmount || 0,
            missingMonths,
          });
        }

        logger.info(
          {
            debugAdded,
            debugSkippedNoFees,
            debugSkippedDate,
            totalNotPaid: notPaidStudents.length,
          },
          "DEBUG: get-not-paid-students result",
        );
        res.json({ notPaidStudents });
      } catch (err) {
        logger.error(
          { err },
          "Legacy POST /courseFees/get-not-paid-students failed",
        );
        res.json({ notPaidStudents: [] });
      }
    },
  );

  // ── Payment Installment Fees by Company (monthly collection data) ──
  // Legacy: GET /api/courseFees/paymentInstallmentFees/:companyId → array of installment records with populated student/course
  gateway.get(
    "/courseFees/paymentInstallmentFees/:companyId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const companyId = p(req, "companyId");

        // Resolve current companyId to all possible IDs (current _id + legacy _legacyId, as both string and ObjectId)
        const companyIdVariants: any[] = [companyId];
        try {
          const { ObjectId } = await import("mongodb");
          if (mongoose.Types.ObjectId.isValid(companyId)) {
            companyIdVariants.push(new ObjectId(companyId));
            const compDoc = await db
              .collection("batchcategories")
              .findOne({ _id: new ObjectId(companyId) });
            if (compDoc?._legacyId) {
              companyIdVariants.push(String(compDoc._legacyId));
              if (mongoose.Types.ObjectId.isValid(String(compDoc._legacyId))) {
                companyIdVariants.push(new ObjectId(String(compDoc._legacyId)));
              }
            }
          }
        } catch {
          /* ignore */
        }

        // Query both new feeinstallments and legacy paymentinstallmenttimes collections
        // Legacy uses companyName (not companyId) and studentInfo (not studentId)
        const companyMatch = { $in: companyIdVariants };
        const [newInstallments, legacyInstallments] = await Promise.all([
          db
            .collection("feeinstallments")
            .find({
              $or: [
                { tenantId, companyId: companyMatch },
                { tenantId: { $exists: false }, companyId: companyMatch },
              ],
            })
            .sort({ createdAt: 1 })
            .toArray(),
          db
            .collection("paymentinstallmenttimes")
            .find({
              $or: [{ companyName: companyMatch }, { companyId: companyMatch }],
            })
            .sort({ createdAt: 1 })
            .toArray(),
        ]);
        const installments = [...newInstallments, ...legacyInstallments];

        // Collect IDs for population (handle both new and legacy field names)
        const studentIds = [
          ...new Set(
            installments
              .map((i: any) => String(i.studentId || i.studentInfo))
              .filter(Boolean),
          ),
        ];
        const courseIds = [
          ...new Set(
            installments
              .map((i: any) => String(i.courseId || i.courseName))
              .filter(Boolean),
          ),
        ];

        const stuMap = new Map<string, any>();
        if (studentIds.length) {
          const stuOr: any[] = [];
          studentIds.forEach((id) => {
            stuOr.push({ _legacyId: id });
            if (mongoose.Types.ObjectId.isValid(id))
              stuOr.push({ _id: new mongoose.Types.ObjectId(id) });
          });
          const stuDocs = await db
            .collection("students")
            .find({
              $and: [
                { $or: [{ tenantId }, { tenantId: { $exists: false } }] },
                { $or: stuOr },
              ],
            })
            .toArray();
          stuDocs.forEach((s: any) => {
            stuMap.set(s._id.toString(), s);
            if (s._legacyId) stuMap.set(String(s._legacyId), s);
          });
        }

        const courseMap = new Map<string, any>();
        if (courseIds.length) {
          const cOr: any[] = [];
          courseIds.forEach((id) => {
            cOr.push({ _legacyId: id });
            if (mongoose.Types.ObjectId.isValid(id))
              cOr.push({ _id: new mongoose.Types.ObjectId(id) });
          });
          const cDocs = await db
            .collection("courses")
            .find({
              $and: [
                { $or: [{ tenantId }, { tenantId: { $exists: false } }] },
                { $or: cOr },
              ],
            })
            .toArray();
          cDocs.forEach((c: any) => {
            courseMap.set(c._id.toString(), c);
            if (c._legacyId) courseMap.set(String(c._legacyId), c);
          });
        }

        // Resolve company once (full populated object for response)
        const compDoc = await db
          .collection("batchcategories")
          .findOne(
            mongoose.Types.ObjectId.isValid(companyId)
              ? { _id: new mongoose.Types.ObjectId(companyId) }
              : { _legacyId: companyId },
          );
        const companyObject = compDoc
          ? {
              _id: compDoc._legacyId || compDoc._id.toString(),
              logo: compDoc.logo || "",
              companyName: compDoc.categoryName || compDoc.companyName || "",
              email: compDoc.email || "",
              companyPhone: compDoc.companyPhone || "",
              companyWebsite: compDoc.companyWebsite || "",
              companyAddress: compDoc.companyAddress || "",
              reciptNumber: compDoc.reciptNumber || "",
              gst: compDoc.gst || "",
              isGstBased: compDoc.isGstBased || "No",
              createdAt: compDoc.createdAt,
              updatedAt: compDoc.updatedAt,
              __v: 0,
            }
          : companyId;

        res.json(
          installments.map((i: any) => {
            const stu =
              stuMap.get(String(i.studentId || i.studentInfo)) ||
              stuMap.get(String(i.studentInfo)) ||
              null;
            const course =
              courseMap.get(String(i.courseId || i.courseName)) ||
              courseMap.get(String(i.courseName)) ||
              null;

            // Full populated student matching legacy prod shape (uses mapStudentToLegacy)
            const studentInfo = stu
              ? mapStudentToLegacy(stu, courseMap)
              : i.studentId || i.studentInfo || null;

            // Full populated course object matching prod shape
            const courseObject = course
              ? {
                  _id: course._legacyId || course._id.toString(),
                  courseName: course.name || course.courseName || "",
                  courseFees: course.fees ?? course.courseFees ?? 0,
                  courseType: course.courseType || "",
                  numberOfYears: course.durationYears ?? course.numberOfYears ?? 0,
                  category: course.category || "",
                  user: course.user || "",
                  createdBy: course.createdBy || "",
                  createdAt: course.createdAt,
                  updatedAt: course.updatedAt,
                  __v: 0,
                }
              : i.courseId || i.courseName || null;

            return {
              _id: i._legacyId || i._id.toString(),
              studentInfo,
              companyName: companyObject,
              courseName: courseObject,
              // Legacy snake_case keys (UI expects these)
              expiration_date: i.expirationDate || i.expiration_date || null,
              installment_number:
                i.installmentNumber || i.installment_number || 0,
              installment_amount:
                i.installmentAmount || i.installment_amount || 0,
              dropOutStudent:
                stu && stu.status
                  ? stu.status === "dropout"
                  : i.dropOutStudent ?? false,
              createdAt: i.createdAt,
              updatedAt: i.updatedAt,
              __v: 0,
            };
          }),
        );
      } catch (err) {
        logger.error(
          { err },
          "Legacy GET /courseFees/paymentInstallmentFees failed",
        );
        res.json([]);
      }
    },
  );

  gateway.get(
    "/courseFees/studentFees/:studentId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const rawId = p(req, "studentId");
        if (!rawId || rawId === "undefined") {
          res.json([]);
          return;
        }

        const db = mongoose.connection.db!;

        // Resolve student: find by _legacyId or _id to get both IDs
        const studentOrClauses: any[] = [{ _legacyId: rawId }];
        if (mongoose.Types.ObjectId.isValid(rawId))
          studentOrClauses.push({ _id: new mongoose.Types.ObjectId(rawId) });
        const student = await db
          .collection("students")
          .findOne({ tenantId, $or: studentOrClauses });

        // Build list of studentId forms to query fees with
        const studentIdForms: string[] = [rawId];
        if (student) {
          if (student._id) studentIdForms.push(student._id.toString());
          if (student._legacyId) studentIdForms.push(student._legacyId);
        }
        const uniqueIds = [...new Set(studentIdForms)];
        const objectIdForms = uniqueIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));

        // Query both coursefees (legacy) and feepayments (new) collections
        const [legacyFees, newFees] = await Promise.all([
          db
            .collection("coursefees")
            .find({
              $and: [
                { $or: [{ tenantId }, { tenantId: { $exists: false } }] },
                {
                  $or: [
                    { studentInfo: { $in: objectIdForms } },
                    { studentId: { $in: uniqueIds } },
                  ],
                },
              ],
            })
            .sort({ createdAt: 1 })
            .toArray(),
          db
            .collection("feepayments")
            .find({
              tenantId,
              $or: [
                { studentInfo: { $in: [...uniqueIds, ...objectIdForms] } },
                { studentId: { $in: uniqueIds } },
              ],
            })
            .sort({ createdAt: 1 })
            .toArray(),
        ]);
        const fees = [...legacyFees, ...newFees];

        if (!fees.length) {
          res.json([]);
          return;
        }

        // Collect paymentOption IDs to populate.
        // A stored value may be either the MongoDB _id OR the _legacyId of the option document
        // (both can look like valid ObjectId hex strings), so we query by BOTH fields for every value.
        const rawPaymentOptionIds = [
          ...new Set(
            fees
              .map((f: any) => f.paymentOption)
              .filter((id: any) => id && String(id).trim())
              .map(String),
          ),
        ];
        const paymentOptionObjectIds = rawPaymentOptionIds
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
        const paymentOptionOrClauses: any[] = [];
        if (paymentOptionObjectIds.length)
          paymentOptionOrClauses.push({ _id: { $in: paymentOptionObjectIds } });
        // Always also check _legacyId — the stored value may be the legacy ID even when it
        // looks like a valid ObjectId hex string.
        if (rawPaymentOptionIds.length)
          paymentOptionOrClauses.push({ _legacyId: { $in: rawPaymentOptionIds } });
        // No tenantId filter: IDs come from already-tenant-scoped fee records,
        // and legacy payment options may have a different tenantId format or none at all.
        const paymentOptions = paymentOptionOrClauses.length
          ? await db
              .collection("paymentoptions")
              .find({ $or: paymentOptionOrClauses })
              .toArray()
          : [];
        const paymentOptionMap = new Map([
          ...paymentOptions.map((p: any) => [p._id.toString(), p] as [string, any]),
          ...paymentOptions
            .filter((p: any) => p._legacyId)
            .map((p: any) => [String(p._legacyId), p] as [string, any]),
        ]);

        // Collect courseId IDs to populate
        const courseIds = fees
          .map((f: any) => f.courseName || f.courseId)
          .filter(
            (id: any) => id && mongoose.Types.ObjectId.isValid(String(id)),
          );
        const courses = courseIds.length
          ? await db
              .collection("courses")
              .find({
                tenantId,
                _id: {
                  $in: courseIds.map(
                    (id: any) => new mongoose.Types.ObjectId(String(id)),
                  ),
                },
              })
              .toArray()
          : [];
        const courseMap2 = new Map(
          courses.map((c: any) => [c._id.toString(), c]),
        );

        // Self-heal: recalculate student totalPaid/remainingFees from actual fee records
        if (student) {
          const actualTotalPaid = fees.reduce(
            (sum: number, f: any) => sum + (Number(f.amountPaid) || 0),
            0,
          );
          const enrollment = Array.isArray(student.enrollment)
            ? student.enrollment[0]
            : student.enrollment;
          const netFees = enrollment?.netFees ?? student.netCourseFees ?? 0;
          const currentTotalPaid =
            enrollment?.totalPaid ?? student.totalPaid ?? 0;

          if (Math.abs(actualTotalPaid - currentTotalPaid) > 0.01) {
            const actualRemaining = netFees - actualTotalPaid;
            const healUpdate: any = {
              totalPaid: actualTotalPaid,
              remainingCourseFees: actualRemaining,
              updatedAt: new Date(),
            };
            if (enrollment) {
              healUpdate.enrollment = {
                ...enrollment,
                totalPaid: actualTotalPaid,
                remainingFees: actualRemaining,
              };
            }
            await db
              .collection("students")
              .updateOne({ _id: student._id }, { $set: healUpdate });
            logger.info(
              {
                studentId: student._id.toString(),
                oldTotalPaid: currentTotalPaid,
                newTotalPaid: actualTotalPaid,
              },
              "Self-healed student fee totals",
            );
          }
        }

        // Resolve addedBy/createdBy user IDs to human-readable names
        const addedByIds = fees.map((f: any) => f.addedBy || f.createdBy).filter(Boolean);
        const addedByMap = await resolveUserNames(db, addedByIds);

        res.json(
          fees.map((f: any) => {
            const payOptId = f.paymentOption ? String(f.paymentOption) : null;
            const payOpt = payOptId
              ? paymentOptionMap.get(payOptId) || null
              : null;
            const courseRefId =
              f.courseName || f.courseId
                ? String(f.courseName || f.courseId)
                : null;
            const course = courseRefId
              ? courseMap2.get(courseRefId) || null
              : null;
            return {
              _id: f._legacyId || f._id.toString(),
              studentInfo: f.studentInfo ? String(f.studentInfo) : null,
              courseName: course
                ? {
                    _id: course._legacyId || course._id.toString(),
                    courseName: course.name || course.courseName,
                    courseFees: course.fees || course.courseFees,
                    courseType: course.courseType,
                  }
                : courseRefId || null,
              netCourseFees: Number(f.netCourseFees) || 0,
              displayNetCourseFees: Number(f.netCourseFees) || 0,
              remainingFees: Number(f.remainingFees) || 0,
              displayRemainingFees: Number(f.remainingFees) || 0,
              amountPaid: Number(f.amountPaid) || 0,
              addedBy: (() => {
                const uid = f.addedBy || f.createdBy || "";
                return addedByMap.get(uid) || uid;
              })(),
              amountDate: f.amountDate || f.paymentDate || f.createdAt,
              reciptNumber: f.reciptNumber || f.receiptNumber || "",
              paymentOption: payOpt
                ? {
                    _id: payOpt._legacyId || payOpt._id.toString(),
                    name: payOpt.optionName || payOpt.name || "",
                  }
                : {
                    // No payment option stored — show dash in UI
                    _id: f.paymentOption ? "__not_found__" : "",
                    name: f.paymentOption ? "Unknown" : "",
                  },
              narration: f.narration || "",
              lateFees: Number(f.lateFees) || 0,
              gst_percentage: Number(f.gst_percentage || f.gstPercentage) || 0,
              createdAt: f.createdAt,
              updatedAt: f.updatedAt || f.createdAt,
              __v: 0,
            };
          }),
        );
      } catch (err) {
        logger.error({ err }, "Legacy courseFees/studentFees query failed");
        res.json([]);
      }
    },
  );

  // ── Issues dashboard by student ID (graceful null/200 when studentId missing or no dashboard found) ──
  // Frontend throws on 404, so we must always return 200 (null when not found)
  gateway.get(
    "/student-issues/showStudentDashboard/:studentId",
    async (req: Request, res: Response) => {
      const studentId = p(req, "studentId");
      if (!studentId || studentId === "undefined") {
        res.json(null);
        return;
      }
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json(null);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;

        // Try all possible ID forms: as-is, legacy lookup, new _id lookup
        const idForms: string[] = [studentId];
        const studentOrClauses: any[] = [{ _legacyId: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId))
          studentOrClauses.push({
            _id: new mongoose.Types.ObjectId(studentId),
          });
        const student = await db
          .collection("students")
          .findOne({ tenantId, $or: studentOrClauses });
        if (student) {
          if (student._id) idForms.push(student._id.toString());
          if (student._legacyId) idForms.push(student._legacyId);
        }
        const uniqueIds = [...new Set(idForms)];

        const dashboard = await db.collection("issuedashboards").findOne({
          tenantId,
          studentId: { $in: uniqueIds },
        });

        if (!dashboard) {
          res.json(null);
          return;
        }
        res.json({
          _id: dashboard._id.toString(),
          studentId: dashboard.studentId,
          showStudent: dashboard.showStudent ?? false,
          updatedAt: dashboard.updatedAt,
        });
      } catch (err) {
        logger.error({ err }, "Legacy showStudentDashboard query failed");
        res.json(null);
      }
    },
  );

  // ── Admission Form POST (legacy: creates a student with flat form fields + optional image upload) ──
  gateway.post(
    "/addmission_form",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ message: "Unauthorized" });
          return;
        }

        const { default: multer } = await import("multer");
        const { default: path } = await import("path");
        const { default: fs } = await import("fs");

        const uploadDir = path.join(process.cwd(), "uploads", "students");
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });

        const storage = multer.diskStorage({
          destination: (_req, _file, cb) => cb(null, uploadDir),
          filename: (_req, file, cb) =>
            cb(null, `student-${Date.now()}${path.extname(file.originalname)}`),
        });
        const upload = multer({
          storage,
          limits: { fileSize: 5 * 1024 * 1024 },
        }).single("image");

        upload(req, res, async (uploadErr) => {
          try {
          if (uploadErr) {
            res.status(400).json({ message: uploadErr.message });
            return;
          }

          const body = req.body as any;
          const { default: mongoose } = await import("mongoose");
          const db = mongoose.connection.db!;

          // Validate required fields
          if (!body.name) {
            res
              .status(400)
              .json({ success: false, message: "Please provide name field!" });
            return;
          }
          if (!body.companyName) {
            res.status(400).json({
              success: false,
              message: "Please provide company Name field!",
            });
            return;
          }

          // Check duplicate by mobile number
          if (body.mobile_number) {
            const existing = await db
              .collection("students")
              .findOne({ tenantId, "contact.mobile": body.mobile_number });
            if (existing) {
              res.status(400).json({
                success: false,
                message: "Admission already done with this mobile_number!",
              });
              return;
            }
          }

          // Parse tenant-defined custom fields (Personal Details section). The
          // frontend sends them as a single JSON object in `customFields`.
          let customFields: Record<string, unknown> = {};
          if (body.customFields) {
            try {
              const parsed =
                typeof body.customFields === "string"
                  ? JSON.parse(body.customFields)
                  : body.customFields;
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                customFields = parsed;
              }
            } catch {
              /* ignore malformed customFields */
            }
          }

          // Server-side enforcement of mandatory custom fields, scoped to the
          // student's company (body.companyName carries the company id).
          const mandatoryDefs = await db
            .collection("customfields")
            .find({
              tenantId,
              companyId: body.companyName,
              formType: "admission",
              mandatory: true,
            })
            .toArray();
          for (const def of mandatoryDefs) {
            const v = customFields[def.fieldName];
            if (v === undefined || v === null || String(v).trim() === "") {
              res.status(400).json({
                success: false,
                message: `${def.fieldName} is required`,
              });
              return;
            }
          }

          const now = new Date();

          // Generate roll number. The `prefix` (e.g. "OSC") is configured per-tenant
          // on the General Settings page; when set, the roll number is rendered as
          // PREFIX/FY-START-YEAR/NUMBER (financial year from 1 April). Otherwise the
          // legacy plain-number scheme is preserved.
          const counter = await db
            .collection("rollnumbercounters")
            .findOneAndUpdate(
              { tenantId },
              { $inc: { seq: 1 } },
              { upsert: true, returnDocument: "after" },
            );
          const rollSeq = (counter?.seq || 1000) + 1000;
          const rollNumber = formatRollNumber(counter?.prefix || "", rollSeq, now);
          const imagePath = (req as any).file
            ? `students/${(req as any).file.filename}`
            : body.image || "";

          // Build student document (matching legacy addmission_form model structure)
          const studentDoc: any = {
            tenantId,
            rollNumber,
            firstName: body.name?.split(" ")[0] || body.name || "",
            lastName: body.name?.split(" ").slice(1).join(" ") || "",
            fatherName: body.father_name || "",
            contact: {
              mobile: body.mobile_number || "",
              phone: body.phone_number || "",
              email: body.email || "",
              address: body.present_address || "",
              city: body.city || "",
            },
            dateOfBirth: body.date_of_birth || null,
            educationQualification: body.education_qualification || "",
            image: imagePath,
            companyName: body.companyName || null,
            enrollment: {
              courseId: body.courseName || body.select_course || null,
              courseName: body.select_course || "",
              courseFees: Number(body.course_fees) || 0,
              discount: Number(body.discount) || 0,
              netFees: Number(body.netCourseFees) || 0,
              remainingFees: Number(body.netCourseFees) || 0,
              totalPaid: 0,
              downPayment: Number(body.down_payment) || 0,
              dateOfJoining: body.date_of_joining || null,
              installmentCount: Number(body.no_of_installments) || 0,
              installmentDuration: body.installment_duration || "",
            },
            status: "active",
            notes: "",
            createdBy: (req as any).user?.userId || "system",
            createdAt: now,
            updatedAt: now,
            // Also store legacy flat fields for backward compatibility
            name: body.name || "",
            father_name: body.father_name || "",
            mobile_number: body.mobile_number || "",
            phone_number: body.phone_number || "",
            present_address: body.present_address || "",
            date_of_birth: body.date_of_birth || null,
            city: body.city || "",
            email: body.email || "",
            education_qualification: body.education_qualification || "",
            select_course: body.select_course || "",
            course_fees: Number(body.course_fees) || 0,
            discount: Number(body.discount) || 0,
            netCourseFees: Number(body.netCourseFees) || 0,
            remainingCourseFees: Number(body.netCourseFees) || 0,
            date_of_joining: body.date_of_joining || null,
            no_of_installments: Number(body.no_of_installments) || 0,
            installment_duration: body.installment_duration || "",
            courseDuration: body.courseRemainderDuration || "",
            totalPaid: 0,
            // Fixed installment mode fields
            admission_fees: Number(body.admission_fees) || 0,
            fixed_installment: body.fixed_installment || "",
            batch_starting_fees: Number(body.batch_starting_fees) || 0,
            // Personal Details / More Options (optional)
            // passportStatus: "available" | "not_applied" | "applied" | "in_progress"
            passportNo:       body.passportNo || "",
            passportStatus:   body.passportStatus || "",
            aadharNo:         body.aadharNo || "",
            aadharStatus:     body.aadharStatus || "",
            panNo:            body.panNo || "",
            panStatus:        body.panStatus || "",
            medicalHistory:   body.medicalHistory || "",
            // Tenant-defined custom admission fields (Personal Details section)
            customFields,
          };

          const result = await db.collection("students").insertOne(studentDoc);

          // Send welcome email — fire-and-forget, only if tenant has it enabled
          Promise.all([
            import("../email/EmailService.js"),
            mongoose.connection
              .db!.collection("tenantsettings")
              .findOne(
                { tenantId },
                { projection: { "_legacySettings.welcomeemails.welcomeemailsuggestion": 1 } },
              ),
          ]).then(([{ EmailService }, settingsDoc]) => {
            const welcomeEnabled =
              settingsDoc?._legacySettings?.welcomeemails?.welcomeemailsuggestion;
            if (!welcomeEnabled) return;
            const studentName = body.name || "";
            const courseName = body.select_course || "";
            const dateOfJoining = body.date_of_joining
              ? new Date(body.date_of_joining).toLocaleDateString("en-IN")
              : "";
            const mobileNumber = body.mobile_number || "";
            const studentEmail = body.email || "";
            new EmailService().send({
              to: studentEmail || "noemail@placeholder.com",
              subject: `Welcome to Flex Academy`,
              html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Welcome Letter</title>
<style>body{font-family:Arial,sans-serif;line-height:1.6;background-color:#f8f9fa;color:#333;margin:0;padding:20px}.container{max-width:700px;margin:0 auto;background:#fff;padding:20px;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,.1)}h1{color:#007bff}.details{margin:20px 0}.details p{margin:5px 0}.footer{margin-top:20px;padding-top:20px;border-top:1px solid #ddd;font-size:.9em}.footer p{margin:5px 0}</style>
</head>
<body><div class="container">
<h1>Welcome to Flex Academy</h1>
<p>Dear ${studentName},</p>
<p>Congratulations on your admission in <strong>${courseName}</strong>! We are thrilled to welcome you to our community of learners.</p>
<div class="details">
<h2>Student Details:</h2>
<p><strong>Student Name:</strong> ${studentName}</p>
<p><strong>Mobile:</strong> ${mobileNumber}</p>
<p><strong>Email:</strong> ${studentEmail}</p>
<p><strong>Course Start Date:</strong> ${dateOfJoining}</p>
<p><strong>Course Name:</strong> ${courseName}</p>
</div>
<p>Our instructors are committed to guiding you through each step of your learning journey.</p>
<div class="footer"><p>Warm regards,</p><p><strong>Centre Manager</strong></p><p><strong>Flex Academy</strong></p></div>
</div></body></html>`,
              tenantId,
              sentBy: "System",
            }).catch((mailErr: unknown) => {
              logger.error(
                { err: mailErr },
                "Welcome mail failed — student still created",
              );
            });
          }).catch((mailErr: unknown) => {
            logger.error({ err: mailErr }, "Welcome mail send/load failed");
          });

          res.status(200).json({
            success: true,
            message: "Addmission done successfully!!",
            _id: result.insertedId.toString(),
          });
          } catch (innerErr) {
            logger.error({ err: innerErr }, "Legacy POST /addmission_form failed");
            next(innerErr);
          }
        });
      } catch (err) {
        logger.error({ err }, "Legacy POST /addmission_form outer error");
        next(err);
      }
    },
  );

  // ── Addmission Form by student ID (legacy: addmission_form = student profile, migrated to students collection) ──
  // The legacy frontend calls GET /api/addmission_form/:id where :id is the student's legacy _id.
  // We look up the student by _legacyId (the migrated old _id) and return in legacy student format.
  gateway.get("/addmission_form/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Not found" },
        });
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");

      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id)) {
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      }

      const student = await mongoose.connection
        .db!.collection("students")
        .findOne({ tenantId, $or: orClauses });

      if (!student) {
        // Return empty student object instead of 404 to prevent frontend crashes
        res.json({
          _id: id,
          name: "Student Not Found",
          companyName: null,
          courseName: null,
          select_course: "",
          remainingCourseFees: 0,
          totalPaid: 0,
          message: "Student data not available",
        });
        return;
      }

      const courseMap = await loadCourseMap(tenantId);
      const legacy = mapStudentToLegacy(student, courseMap);

      // Populate companyName as full object (profile view needs companyName._id)
      const rawCompanyId = legacy.companyName; // plain string from mapStudentToLegacy
      if (rawCompanyId) {
        const companyOrClauses: any[] = [{ _legacyId: rawCompanyId }];
        if (mongoose.Types.ObjectId.isValid(rawCompanyId))
          companyOrClauses.push({
            _id: new mongoose.Types.ObjectId(rawCompanyId),
          });
        const company = await mongoose.connection
          .db!.collection("batchcategories")
          .findOne({ tenantId, $or: companyOrClauses });
        if (company) {
          // Always String() — _legacyId may be a BSON ObjectId object from the driver
          const companyId = company._legacyId
            ? String(company._legacyId)
            : company._id.toString();
          legacy.companyName = {
            _id: companyId,
            companyName: company.categoryName || company.companyName || "",
            logo: company.logo || "",
            email: company.email || "",
            companyPhone: company.companyPhone || "",
            companyWebsite: company.companyWebsite || "",
            companyAddress: company.companyAddress || "",
            reciptNumber: company.reciptNumber || "",
            gst: company.gst || "",
            isGstBased: company.isGstBased || "No",
          };
        } else {
          // Fallback: still provide _id so companyName._id doesn't crash
          legacy.companyName = { _id: String(rawCompanyId) };
        }
      }

      // courseName is used as courseId by CourseStudentSubjectMarks — must be a plain string ID,
      // not the populated object that mapStudentToLegacy returns.
      if (legacy.courseName && typeof legacy.courseName === "object") {
        legacy.courseName = String((legacy.courseName as any)._id || "");
      }

      res.json(legacy);
    } catch (err) {
      logger.error({ err }, "Legacy addmission_form by id query failed");
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Student by email (for logged-in user profile) ──
  gateway.get(
    "/students/:idOrEmail",
    async (req: Request, res: Response, next: NextFunction) => {
      const param = p(req, "idOrEmail");
      // Only handle email lookups here; ObjectId lookups fall through to generic handler
      if (!param.includes("@")) {
        next();
        return;
      }

      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json(null);
          return;
        }

        const { default: mongoose } = await import("mongoose");
        const student = await mongoose.connection
          .db!.collection("students")
          .findOne({ tenantId, "contact.email": param });

        if (!student) {
          res.json(null);
          return;
        }
        const courseMap = await loadCourseMap(tenantId);
        res.json(mapStudentToLegacy(student, courseMap));
      } catch (err) {
        logger.error({ err }, "Legacy student by email query failed");
        res.json(null);
      }
    },
  );

  // ── Login response transformer ──
  // Old frontend expects: { api_token, email, first_name, last_name, ... }
  // New backend returns:  { success, data: { user: {...}, tokens: { accessToken, refreshToken } } }
  // ── Login (POST /users/auth) ──
  // In development: direct login with email+password → return token
  // In production: OTP flow → validate creds → send OTP → verify → return token
  gateway.post("/users/auth", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as any;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      // Find user by email (any tenant)
      const user = await db.collection("users").findOne({ email });
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }
      if (!user.isActive) {
        res.status(401).json({ message: "Account is deactivated" });
        return;
      }

      // Verify password
      const isValid = await bcryptjs.compare(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Check per-tenant OTP setting — admin can disable OTP for their company
      const tenantSettings = await db
        .collection("tenantsettings")
        .findOne({ tenantId: user.tenantId });
      const tenantOtpEnabled =
        tenantSettings?._legacySettings?.otp?.otpEnabled ?? true;

      // SKIP_OTP env explicitly controls OTP behavior (true/false).
      // When unset, defaults to skipping OTP only in development.
      // If the tenant admin has disabled OTP, always skip regardless of env.
      const skipOtpEnv =
        process.env.SKIP_OTP !== undefined
          ? process.env.SKIP_OTP === "true"
          : process.env.NODE_ENV === "development";
      const skipOtp = skipOtpEnv || !tenantOtpEnabled;

      if (skipOtp) {
        // ── DEVELOPMENT: Skip OTP, return token directly ──
        const tokens = tokenService.generateTokenPair({
          userId: user._id.toString(),
          tenantId: user.tenantId,
          role: user.role,
          firstName: user.firstName || user.fName || "",
          lastName: user.lastName || user.lName || "",
          email: user.email,
        });

        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: { isOtpVerified: true, refreshToken: tokens.refreshToken },
          },
        );

        let loginCompanyId: string | undefined;
        if (user.role === "Trainer") {
          // 1. Try trainer entity by email
          if (user.email) {
            const trainerDoc = await db.collection("trainers").findOne(
              {
                tenantId: user.tenantId,
                $or: [{ email: user.email }, { trainerEmail: user.email }],
              },
              { projection: { companyId: 1 } },
            );
            const rawId = trainerDoc?.companyId;
            loginCompanyId = rawId ? String(rawId) : undefined;
          }
          // 2. Fallback: read companyId (or first companyIds) from user document
          if (!loginCompanyId) {
            const rawId = user.companyId ||
              (Array.isArray(user.companyIds) && user.companyIds.length > 0
                ? user.companyIds[0]
                : undefined);
            loginCompanyId = rawId ? String(rawId) : undefined;
          }
        } else {
          // For Admin/SuperAdmin: resolve their company from batchcategories (_legacyId preferred)
          const batchCat = await db.collection("batchcategories")
            .findOne({ tenantId: user.tenantId }, { projection: { _id: 1, _legacyId: 1 } });
          if (batchCat) {
            loginCompanyId = batchCat._legacyId ? String(batchCat._legacyId) : batchCat._id.toString();
          }
        }

        res.json({
          api_token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          email: user.email,
          first_name: user.firstName || user.fName || "",
          last_name: user.lastName || user.lName || "",
          role: user.role,
          id: user._legacyId || user._id.toString(),
          tenantId: user.tenantId,
          ...(loginCompanyId ? { companyId: loginCompanyId } : {}),
        });
      } else {
        // ── PRODUCTION: OTP flow ──
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Save OTP to DB first, then respond immediately — email is fire-and-forget.
        // This prevents the 2–5s Gmail SMTP latency from blocking the login response.
        await db
          .collection("users")
          .updateOne(
            { _id: user._id },
            { $set: { otp, otpExpiresAt, isOtpVerified: false } },
          );

        // Respond to client right away — OTP is already persisted
        res.json({
          requiresOTP: true,
          email: user.email,
          first_name: user.firstName || user.fName || "",
          last_name: user.lastName || user.lName || "",
          role: user.role,
          id: user._legacyId || user._id.toString(),
          message: "OTP sent to your email",
        });

        // Send email in background — does not block the HTTP response
        emailService.send({
          to: email,
          tenantId: user.tenantId,
          subject: "Your Login OTP",
          html: `<div style="font-family:Arial;max-width:500px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
              <h2 style="color:#007bff;text-align:center;">Login Verification</h2>
              <p>Hello ${user.firstName || user.fName || "User"},</p>
              <p>Your OTP is:</p>
              <div style="text-align:center;margin:20px 0;">
                <span style="font-size:32px;font-weight:bold;color:#007bff;letter-spacing:8px;padding:10px 20px;background:#f0f0f0;border-radius:8px;">${otp}</span>
              </div>
              <p style="color:#666;">Expires in <strong>5 minutes</strong>.</p></div>`,
        }).then(() => {
          logger.info({ email, tenantId: user.tenantId }, "OTP email sent");
        }).catch((emailErr) => {
          logger.error({ emailErr }, "Failed to send OTP email");
        });
      }
    } catch (err) {
      logger.error({ err }, "Legacy POST /users/auth failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Verify OTP (POST /users/verify-otp) ──
  gateway.post("/users/verify-otp", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body as any;
      if (!email || !otp) {
        res.status(400).json({ message: "Email and OTP are required" });
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      const user = await db.collection("users").findOne({ email });
      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      // Check OTP expiry
      if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
        res
          .status(401)
          .json({ message: "OTP has expired. Please request a new one." });
        return;
      }

      // Verify OTP
      if (user.otp !== String(otp)) {
        res.status(401).json({ message: "Invalid OTP!" });
        return;
      }

      // OTP verified — generate JWT tokens (include profile so verifyToken needs no DB hit)
      const tokens = tokenService.generateTokenPair({
        userId: user._id.toString(),
        tenantId: user.tenantId,
        role: user.role,
        firstName: user.firstName || user.fName || "",
        lastName: user.lastName || user.lName || "",
        email: user.email,
      });

      // Clear OTP and mark verified
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            otp: null,
            otpExpiresAt: null,
            isOtpVerified: true,
            refreshToken: tokens.refreshToken,
          },
        },
      );

      // Return legacy response format with token
      let otpTrainerCompanyId: string | undefined;
      if (user.role === "Trainer") {
        if (user.email) {
          const trainerDoc = await db.collection("trainers").findOne(
            {
              tenantId: user.tenantId,
              $or: [{ email: user.email }, { trainerEmail: user.email }],
            },
            { projection: { companyId: 1 } },
          );
          const rawId = trainerDoc?.companyId;
          otpTrainerCompanyId = rawId ? String(rawId) : undefined;
        }
        if (!otpTrainerCompanyId) {
          const rawId = user.companyId ||
            (Array.isArray(user.companyIds) && user.companyIds.length > 0
              ? user.companyIds[0]
              : undefined);
          otpTrainerCompanyId = rawId ? String(rawId) : undefined;
        }
      }
      res.json({
        api_token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        email: user.email,
        first_name: user.firstName || user.fName || "",
        last_name: user.lastName || user.lName || "",
        role: user.role,
        id: user._legacyId || user._id.toString(),
        tenantId: user.tenantId,
        ...(otpTrainerCompanyId ? { companyId: otpTrainerCompanyId } : {}),
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /users/verify-otp failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Resend OTP (POST /users/resend-otp) ──
  gateway.post("/users/resend-otp", async (req: Request, res: Response) => {
    try {
      const { email } = req.body as any;
      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      const user = await db.collection("users").findOne({ email });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Generate new OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { otp, otpExpiresAt, isOtpVerified: false } },
        );

      // Send email
      try {
        const { EmailService } = await import("../email/EmailService.js");
        const emailSvc = new EmailService();
        await emailSvc.send({
          to: email,
          tenantId: user.tenantId,
          subject: "Your Login OTP (Resent)",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h2 style="color: #007bff; text-align: center;">Login Verification</h2>
              <p>Hello ${user.firstName || user.fName || "User"},</p>
              <p>Your new OTP for login is:</p>
              <div style="text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; padding: 10px 20px; background: #f0f0f0; border-radius: 8px;">${otp}</span>
              </div>
              <p style="color: #666;">This OTP will expire in <strong>5 minutes</strong>.</p>
            </div>
          `,
        });
        logger.info({ email, tenantId: user.tenantId }, "OTP resent");
      } catch (emailErr) {
        logger.error({ emailErr }, "Failed to resend OTP email");
      }

      res.json({ success: true, message: "OTP resent to your email" });
    } catch (err) {
      logger.error({ err }, "Legacy POST /users/resend-otp failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── OTP status GET ──
  // Returns whether OTP verification is enabled for this tenant's company.
  gateway.get("/student-otp/status", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ otpStatus: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const settings = await mongoose.connection
        .db!.collection("tenantsettings")
        .findOne({ tenantId });
      const otpEnabled =
        settings?._legacySettings?.otp?.otpEnabled ?? true;
      res.json({
        otpStatus: [{ _id: "default", otpEnabled }],
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /student-otp/status failed");
      res.json({ otpStatus: [] });
    }
  });

  // ── OTP status POST ──
  gateway.post("/student-otp/status", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const { otpEnabled } = req.body as any;
      await mongoose.connection.db!.collection("tenantsettings").updateOne(
        { tenantId },
        { $set: { "_legacySettings.otp.otpEnabled": Boolean(otpEnabled) } },
        { upsert: true },
      );
      res.json({ message: "OTP setting updated" });
    } catch (err) {
      logger.error({ err }, "Legacy POST /student-otp/status failed");
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ── Auto Logout status GET ──
  // Returns auto-logout configuration for this tenant.
  gateway.get("/auto-logout/status", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ autoLogoutStatus: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const settings = await mongoose.connection
        .db!.collection("tenantsettings")
        .findOne({ tenantId });
      const al = settings?._legacySettings?.autoLogout;
      res.json({
        autoLogoutStatus: [
          {
            _id: "default",
            autoLogoutEnabled: al?.autoLogoutEnabled ?? false,
            timeoutMinutes: al?.timeoutMinutes ?? 30,
          },
        ],
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /auto-logout/status failed");
      res.json({ autoLogoutStatus: [] });
    }
  });

  // ── Auto Logout status POST ──
  gateway.post("/auto-logout/status", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const { autoLogoutEnabled, timeoutMinutes } = req.body as any;
      await mongoose.connection.db!.collection("tenantsettings").updateOne(
        { tenantId },
        {
          $set: {
            "_legacySettings.autoLogout.autoLogoutEnabled":
              Boolean(autoLogoutEnabled),
            "_legacySettings.autoLogout.timeoutMinutes":
              Number(timeoutMinutes) || 30,
          },
        },
        { upsert: true },
      );
      res.json({ message: "Auto logout setting updated" });
    } catch (err) {
      logger.error({ err }, "Legacy POST /auto-logout/status failed");
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ── Fixed Installment Mode setting GET ──
  gateway.get("/fixedInstallmentMode/status", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ fixedInstallmentMode: [{ _id: "default", enabled: false }] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const settings = await mongoose.connection
        .db!.collection("tenantsettings")
        .findOne({ tenantId });
      const enabled =
        settings?._legacySettings?.fixedInstallmentMode?.enabled ?? false;
      const values: string[] =
        settings?._legacySettings?.fixedInstallmentMode?.values ?? [];
      const discounts: Array<{ name: string; value: number }> =
        settings?._legacySettings?.fixedInstallmentMode?.discounts ?? [];
      res.json({
        fixedInstallmentMode: [{ _id: "default", enabled, values, discounts }],
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /fixedInstallmentMode/status failed");
      res.json({ fixedInstallmentMode: [{ _id: "default", enabled: false }] });
    }
  });

  // ── Fixed Installment Mode setting POST ──
  gateway.post("/fixedInstallmentMode/status", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const { enabled, values, discounts } = req.body as any;
      const update: Record<string, unknown> = {
        "_legacySettings.fixedInstallmentMode.enabled": Boolean(enabled),
      };
      if (values !== undefined)
        update["_legacySettings.fixedInstallmentMode.values"] = Array.isArray(values)
          ? values.map(String)
          : [];
      if (discounts !== undefined)
        update["_legacySettings.fixedInstallmentMode.discounts"] = Array.isArray(discounts)
          ? discounts.map((d: any) => ({
              name: String(d.name || ""),
              value: Number(d.value) || 0,
            }))
          : [];
      await mongoose.connection.db!.collection("tenantsettings").updateOne(
        { tenantId },
        { $set: update },
        { upsert: true },
      );
      res.json({ message: "Fixed installment mode setting updated" });
    } catch (err) {
      logger.error({ err }, "Legacy POST /fixedInstallmentMode/status failed");
      res.status(500).json({ error: "Internal error" });
    }
  });

  // ── GET /batches/:id — explicit handler: populate trainer + students with names ──
  gateway.get("/batches/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND" } });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const id = p(req, "id");

      // Find batch by _id or _legacyId
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const batch = await db
        .collection("batches")
        .findOne({ tenantId, $or: orClauses });
      if (!batch) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Batch not found" },
        });
        return;
      }

      // Populate trainer — try both 'trainer' (new _id) and 'trainerId' (legacy _id)
      let trainerObj: any = null;
      const trainerIds = [batch.trainer, batch.trainerId]
        .map(String)
        .filter((v) => v && v !== "undefined");
      for (const tId of trainerIds) {
        if (trainerObj) break;
        const tOrClauses: any[] = [{ _legacyId: tId }];
        if (mongoose.Types.ObjectId.isValid(tId))
          tOrClauses.push({ _id: new mongoose.Types.ObjectId(tId) });
        const t = await db
          .collection("trainers")
          .findOne({ tenantId, $or: tOrClauses });
        if (t) {
          trainerObj = {
            _id: t._id.toString(),
            trainerName: t.trainerName || t.name || "",
            trainerDesignation: t.trainerDesignation || t.specialization || "",
            trainerEmail: t.trainerEmail || t.email || "",
          };
        }
      }

      // Populate students: resolve student IDs to student docs with name, courseName, remainingFees
      const rawStudents = Array.isArray(batch.students) ? batch.students : [];
      const populatedStudents: any[] = [];
      for (const s of rawStudents) {
        // s might be a string "[object Object]" from bad migration, or an object { student: ObjectId, subjects: [...] }
        if (typeof s === "string") continue; // skip corrupted data
        const studentId = s.student
          ? String(s.student)
          : s.studentId
            ? String(s.studentId)
            : null;
        if (!studentId) continue;

        const sOrClauses: any[] = [{ _legacyId: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId))
          sOrClauses.push({ _id: new mongoose.Types.ObjectId(studentId) });
        const studentDoc = await db
          .collection("students")
          .findOne({ tenantId, $or: sOrClauses });

        // Resolve course name (students use singular 'enrollment', not plural 'enrollments')
        let courseNameObj: any = null;
        const enrollment =
          studentDoc?.enrollment || studentDoc?.enrollments?.[0];
        const courseId = enrollment?.courseId
          ? String(enrollment.courseId)
          : null;
        if (courseId) {
          const cOrClauses: any[] = [{ _legacyId: courseId }];
          if (mongoose.Types.ObjectId.isValid(courseId))
            cOrClauses.push({ _id: new mongoose.Types.ObjectId(courseId) });
          const course = await db
            .collection("courses")
            .findOne({ tenantId, $or: cOrClauses });
          if (course)
            courseNameObj = {
              _id: course._legacyId || course._id.toString(),
              courseName: course.courseName || course.name || "",
            };
        }

        // Resolve subjects — prefer course-specific match for consistent _id with subjects endpoint
        const courseLegacyId = courseNameObj?._id;
        const subjects = Array.isArray(s.subjects)
          ? await Promise.all(
              s.subjects.map(async (sub: any) => {
                if (typeof sub === "string")
                  return { subject: null, status: "notStarted", progress: 0 };
                const subjectRef = sub.subject
                  ? String(sub.subject)
                  : sub.subjectName || null;
                let subjectObj: any = null;
                if (subjectRef) {
                  // Try by _id/_legacyId first
                  const subOr: any[] = [{ _legacyId: subjectRef }];
                  if (mongoose.Types.ObjectId.isValid(subjectRef))
                    subOr.push({
                      _id: new mongoose.Types.ObjectId(subjectRef),
                    });
                  let subDoc = await db
                    .collection("subjects")
                    .findOne({ tenantId, $or: subOr });
                  // If not found by ID, try by name with course preference
                  if (!subDoc && courseLegacyId) {
                    subDoc = await db.collection("subjects").findOne({
                      tenantId,
                      courseId: courseLegacyId,
                      subjectName: subjectRef,
                    });
                  }
                  if (!subDoc) {
                    subDoc = await db
                      .collection("subjects")
                      .findOne({ tenantId, subjectName: subjectRef });
                  }
                  if (subDoc)
                    subjectObj = {
                      _id: subDoc._legacyId || subDoc._id.toString(),
                      subjectName: subDoc.subjectName || "",
                    };
                  else
                    subjectObj = {
                      _id: subjectRef,
                      subjectName: sub.subjectName || subjectRef,
                    };
                }
                return { ...sub, subject: subjectObj };
              }),
            )
          : [];

        // Build student name from firstName + lastName (students don't have a 'name' field)
        const studentName = studentDoc
          ? studentDoc.name ||
            [studentDoc.firstName, studentDoc.lastName]
              .filter(Boolean)
              .join(" ") ||
            ""
          : "";

        populatedStudents.push({
          _id: s._id?.toString?.() || studentId,
          student: studentDoc
            ? {
                _id: studentDoc._legacyId || studentDoc._id.toString(),
                name: studentName,
                firstName: studentDoc.firstName || "",
                lastName: studentDoc.lastName || "",
                email: studentDoc.contact?.email || studentDoc.email || "",
                phone:
                  studentDoc.contact?.mobile || studentDoc.mobile_number || "",
                courseName: courseNameObj,
                date_of_joining:
                  enrollment?.dateOfJoining ||
                  studentDoc.date_of_joining ||
                  null,
                remainingCourseFees:
                  enrollment?.remainingFees ??
                  enrollment?.remainingCourseFees ??
                  studentDoc.remainingCourseFees ??
                  0,
              }
            : { _id: studentId, name: "" },
          subjects,
          currentSoftware:
            s.currentSoftware ||
            subjects
              .map((sub: any) => sub.subject?.subjectName)
              .filter(Boolean)
              .join(", ") ||
            "",
        });
      }

      res.json({
        success: true,
        data: {
          _id: batch._id.toString(),
          _legacyId: batch._legacyId || null,
          name: batch.name || batch.batchName || "",
          courseCategory: batch.courseCategory || batch.companyId || "",
          course: batch.course || "",
          trainer: trainerObj || null,
          startTime: batch.startTime || "",
          endTime: batch.endTime || "",
          startDate: batch.startDate || null,
          endDate: batch.endDate || null,
          status: batch.status || "inProgress",
          students: populatedStudents,
          isActive: batch.isActive ?? true,
          createdAt: batch.createdAt,
          updatedAt: batch.updatedAt || batch.createdAt,
        },
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /batches/:id failed");
      res
        .status(500)
        .json({ success: false, error: { code: "INTERNAL_ERROR" } });
    }
  });

  // ── Attendance: GET all attendance records (optionally filtered by batch) ──
  // Legacy: GET /api/attendence          → all records  { success: true, attendances: [...] }
  //         GET /api/attendence?batchId= → batch-only   { success: true, attendances: [...] }
  // attendances[].students[].student is populated with { _id, name }
  gateway.get("/attendence", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json({ success: true, attendances: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      const batchIdFilter = req.query.batchId as string | undefined;
      const baseQuery: any = { tenantId };

      if (batchIdFilter) {
        // Resolve batch doc to handle both legacy IDs and ObjectIds
        const bOrClauses: any[] = [{ _legacyId: batchIdFilter }];
        if (mongoose.Types.ObjectId.isValid(batchIdFilter)) {
          bOrClauses.push({ _id: new mongoose.Types.ObjectId(batchIdFilter) });
        }
        const batchDoc = await db
          .collection("batches")
          .findOne({ tenantId, $or: bOrClauses });
        const batchRealId = batchDoc ? batchDoc._id.toString() : batchIdFilter;
        const batchClauses: any[] = [
          { batch: batchIdFilter },
          { batch: batchRealId },
        ];
        if (batchDoc?._legacyId)
          batchClauses.push({ batch: String(batchDoc._legacyId) });
        baseQuery.$or = batchClauses;
      }

      const attendances = await db
        .collection("attendances")
        .find(baseQuery)
        .toArray();

      // Collect all student IDs for batch population
      const allStudentIds = new Set<string>();
      const allBatchIds = new Set<string>();
      attendances.forEach((a: any) => {
        if (a.batch) allBatchIds.add(String(a.batch));
        (a.students || []).forEach((s: any) => {
          const sid = s.student ? String(s.student) : "";
          if (sid) allStudentIds.add(sid);
        });
      });

      // Batch lookup map
      const batchMap = new Map<string, any>();
      if (allBatchIds.size) {
        const batchOrClauses: any[] = [];
        allBatchIds.forEach((id) => {
          batchOrClauses.push({ _legacyId: id });
          if (mongoose.Types.ObjectId.isValid(id))
            batchOrClauses.push({ _id: new mongoose.Types.ObjectId(id) });
        });
        const batchDocs = await db
          .collection("batches")
          .find({ tenantId, $or: batchOrClauses })
          .toArray();
        batchDocs.forEach((b: any) => {
          batchMap.set(b._id.toString(), b);
          if (b._legacyId) batchMap.set(String(b._legacyId), b);
        });
      }

      // Student lookup map
      const studentMap = new Map<string, any>();
      if (allStudentIds.size) {
        const stuOrClauses: any[] = [];
        allStudentIds.forEach((id) => {
          stuOrClauses.push({ _legacyId: id });
          if (mongoose.Types.ObjectId.isValid(id))
            stuOrClauses.push({ _id: new mongoose.Types.ObjectId(id) });
        });
        const stuDocs = await db
          .collection("students")
          .find({ tenantId, $or: stuOrClauses })
          .toArray();
        stuDocs.forEach((s: any) => {
          studentMap.set(s._id.toString(), s);
          if (s._legacyId) studentMap.set(String(s._legacyId), s);
        });
      }

      res.json({
        success: true,
        attendances: attendances.map((a: any) => {
          const batchDoc = a.batch
            ? batchMap.get(String(a.batch)) || null
            : null;
          return {
            _id: a._id.toString(),
            type: a.type || "GLOBAL",
            batch: batchDoc
              ? {
                  _id: batchDoc._id.toString(),
                  name: batchDoc.name || batchDoc.batchName || "",
                }
              : a.batch || null,
            month: a.month,
            year: a.year,
            students: (a.students || []).map((s: any) => {
              const sid = s.student ? String(s.student) : "";
              const stuDoc = sid ? studentMap.get(sid) || null : null;
              const days =
                s.days instanceof Map
                  ? Object.fromEntries(s.days)
                  : s.days || {};
              return {
                student: stuDoc
                  ? {
                      _id: stuDoc._legacyId || stuDoc._id.toString(),
                      name: stuDoc.personalInfo?.fullName || stuDoc.name || "",
                    }
                  : sid || null,
                days,
              };
            }),
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          };
        }),
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /attendence failed");
      res.json({ success: true, attendances: [] });
    }
  });

  // ── Attendance: GET by student ID ──
  // Legacy: GET /api/attendence/student/:studentId → { success, studentId, studentName, totalPresent, totalAbsent, attendance: [...] }
  gateway.get(
    "/attendence/student/:studentId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        const studentId = p(req, "studentId");
        if (!tenantId || !studentId) {
          res.json({
            success: true,
            studentId: "",
            studentName: "",
            totalPresent: 0,
            totalAbsent: 0,
            attendance: [],
          });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;

        // Resolve student ID forms
        const idForms: string[] = [studentId];
        const sOrClauses: any[] = [{ _legacyId: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId))
          sOrClauses.push({ _id: new mongoose.Types.ObjectId(studentId) });
        const stuDoc = await db
          .collection("students")
          .findOne({ tenantId, $or: sOrClauses });
        if (stuDoc) {
          idForms.push(stuDoc._id.toString());
          if (stuDoc._legacyId) idForms.push(String(stuDoc._legacyId));
        }
        const uniqueIds = [...new Set(idForms)];

        const attendances = await db
          .collection("attendances")
          .find({
            tenantId,
            "students.student": { $in: uniqueIds },
          })
          .sort({ year: 1, month: 1 })
          .toArray();

        let totalPresent = 0;
        let totalAbsent = 0;
        const studentName =
          stuDoc?.personalInfo?.fullName || stuDoc?.name || "";

        // Batch lookup
        const batchIds = [
          ...new Set(
            attendances.map((a: any) => String(a.batch || "")).filter(Boolean),
          ),
        ];
        const batchMap = new Map<string, any>();
        if (batchIds.length) {
          const bOr: any[] = [];
          batchIds.forEach((id) => {
            bOr.push({ _legacyId: id });
            if (mongoose.Types.ObjectId.isValid(id))
              bOr.push({ _id: new mongoose.Types.ObjectId(id) });
          });
          const bDocs = await db
            .collection("batches")
            .find({ tenantId, $or: bOr })
            .toArray();
          bDocs.forEach((b: any) => {
            batchMap.set(b._id.toString(), b);
            if (b._legacyId) batchMap.set(String(b._legacyId), b);
          });
        }

        const attendance = attendances
          .map((att: any) => {
            const studentEntry = (att.students || []).find((s: any) =>
              uniqueIds.includes(String(s.student)),
            );
            if (!studentEntry) return null;
            const days =
              studentEntry.days instanceof Map
                ? Object.fromEntries(studentEntry.days)
                : studentEntry.days || {};
            let present = 0,
              absent = 0;
            Object.values(days).forEach((v: any) => {
              if (v === "P") present++;
              if (v === "A") absent++;
            });
            totalPresent += present;
            totalAbsent += absent;
            const bDoc = att.batch
              ? batchMap.get(String(att.batch)) || null
              : null;
            return {
              batchId: bDoc ? bDoc._id.toString() : att.batch || null,
              batchName: bDoc ? bDoc.name || bDoc.batchName || "" : "",
              year: att.year,
              month: att.month,
              monthName: new Date(att.year, att.month).toLocaleString(
                "default",
                { month: "long" },
              ),
              present,
              absent,
              days,
            };
          })
          .filter(Boolean);

        res.json({
          success: true,
          studentId,
          studentName,
          totalPresent,
          totalAbsent,
          attendance,
        });
      } catch (err) {
        logger.error(
          { err },
          "Legacy GET /attendence/student/:studentId failed",
        );
        res.json({
          success: true,
          studentId: p(req, "studentId"),
          studentName: "",
          totalPresent: 0,
          totalAbsent: 0,
          attendance: [],
        });
      }
    },
  );

  // ── Attendance: GET by batch ID + month/year ──
  // Legacy: GET /api/attendence/:batchId?month=X&year=Y → { success, batch, month, year, students: [{ student, name, days }] }
  gateway.get("/attendence/:batchId", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      const batchId = p(req, "batchId");
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (!tenantId || !batchId) {
        res.json({ success: true, students: [] });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      // Resolve batch ID
      const bOrClauses: any[] = [{ _legacyId: batchId }];
      if (mongoose.Types.ObjectId.isValid(batchId))
        bOrClauses.push({ _id: new mongoose.Types.ObjectId(batchId) });
      const batchDoc = await db
        .collection("batches")
        .findOne({ tenantId, $or: bOrClauses });
      const batchRealId = batchDoc ? batchDoc._id.toString() : batchId;

      // Find attendance — try both the real _id and legacy ID
      const attQuery: any = { tenantId, month, year };
      attQuery.$or = [{ batch: batchRealId }];
      if (batchDoc?._legacyId)
        attQuery.$or.push({ batch: String(batchDoc._legacyId) });
      attQuery.$or.push({ batch: batchId });

      const register = await db.collection("attendances").findOne(attQuery);
      if (!register) {
        res.json({ success: true, students: [] });
        return;
      }

      // Populate student names
      const studentIds = (register.students || [])
        .map((s: any) => String(s.student))
        .filter(Boolean);
      const stuMap = new Map<string, any>();
      if (studentIds.length) {
        const stuOr: any[] = [];
        studentIds.forEach((id: string) => {
          stuOr.push({ _legacyId: id });
          if (mongoose.Types.ObjectId.isValid(id))
            stuOr.push({ _id: new mongoose.Types.ObjectId(id) });
        });
        const stuDocs = await db
          .collection("students")
          .find({ tenantId, $or: stuOr })
          .toArray();
        stuDocs.forEach((s: any) => {
          stuMap.set(s._id.toString(), s);
          if (s._legacyId) stuMap.set(String(s._legacyId), s);
        });
      }

      res.json({
        success: true,
        batch: batchRealId,
        month: register.month,
        year: register.year,
        students: (register.students || []).map((s: any) => {
          const sid = String(s.student);
          const stuDoc = stuMap.get(sid) || null;
          const days =
            s.days instanceof Map ? Object.fromEntries(s.days) : s.days || {};
          return {
            student: sid,
            name: stuDoc
              ? stuDoc.personalInfo?.fullName || stuDoc.name || ""
              : "",
            days,
          };
        }),
      });
    } catch (err) {
      logger.error({ err }, "Legacy GET /attendence/:batchId failed");
      res.json({ success: true, students: [] });
    }
  });

  // ── Attendance: POST batch attendance ──
  // Legacy: POST /api/attendence → { batchId, month, year, students: [{ student, days: { "1": "P", "2": "A" } }] }
  gateway.post("/attendence", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const { batchId, month, year, students } = req.body as any;

      if (month === undefined || year === undefined) {
        res
          .status(400)
          .json({ success: false, message: "Month and Year are required" });
        return;
      }

      const type = batchId ? "BATCH" : "GLOBAL";
      const query: any = {
        tenantId,
        type,
        month: Number(month),
        year: Number(year),
      };
      if (batchId) query.batch = batchId;
      else query.batch = null;

      let attendance = await db.collection("attendances").findOne(query);

      if (!attendance) {
        const doc = {
          tenantId,
          type,
          batch: batchId || null,
          month: Number(month),
          year: Number(year),
          students: students || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const result = await db.collection("attendances").insertOne(doc);
        res.json({
          success: true,
          message:
            type === "BATCH"
              ? "Batch Attendance Created"
              : "Global Attendance Created",
          attendance: { ...doc, _id: result.insertedId },
        });
        return;
      }

      // Merge students
      const existingStudents = attendance.students || [];
      (students || []).forEach((incoming: any) => {
        if (!incoming.days) incoming.days = {};
        const idx = existingStudents.findIndex(
          (s: any) => String(s.student) === String(incoming.student),
        );
        if (idx !== -1) {
          const existingDays =
            existingStudents[idx].days instanceof Map
              ? Object.fromEntries(existingStudents[idx].days)
              : existingStudents[idx].days || {};
          existingStudents[idx].days = { ...existingDays, ...incoming.days };
        } else {
          existingStudents.push(incoming);
        }
      });

      await db.collection("attendances").updateOne(
        { _id: attendance._id },
        {
          $set: {
            students: existingStudents,
            updatedAt: new Date().toISOString(),
          },
        },
      );

      res.json({
        success: true,
        message:
          type === "BATCH"
            ? "Batch Attendance Updated"
            : "Global Attendance Updated",
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /attendence failed");
      res.status(500).json({ success: false, message: "Internal error" });
    }
  });

  // ── Attendance: POST global (all students) ──
  // Legacy: POST /api/attendence/all-stu-attendance → { month, year, students: [...] }
  gateway.post(
    "/attendence/all-stu-attendance",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ success: false, message: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const { month, year, students } = req.body as any;

        if (month === undefined || year === undefined) {
          res
            .status(400)
            .json({ success: false, message: "Month and Year are required" });
          return;
        }

        const query = {
          tenantId,
          type: "GLOBAL",
          batch: null,
          month: Number(month),
          year: Number(year),
        };
        let attendance = await db.collection("attendances").findOne(query);

        if (!attendance) {
          const doc = {
            tenantId,
            type: "GLOBAL",
            batch: null,
            month: Number(month),
            year: Number(year),
            students: students || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const result = await db.collection("attendances").insertOne(doc);
          res.json({
            success: true,
            message: "Global Attendance Created",
            attendance: { ...doc, _id: result.insertedId },
          });
          return;
        }

        // Merge
        const existingStudents = attendance.students || [];
        (students || []).forEach((incoming: any) => {
          if (!incoming.days) incoming.days = {};
          const idx = existingStudents.findIndex(
            (s: any) => String(s.student) === String(incoming.student),
          );
          if (idx !== -1) {
            const existingDays =
              existingStudents[idx].days instanceof Map
                ? Object.fromEntries(existingStudents[idx].days)
                : existingStudents[idx].days || {};
            existingStudents[idx].days = { ...existingDays, ...incoming.days };
          } else {
            existingStudents.push(incoming);
          }
        });

        await db.collection("attendances").updateOne(
          { _id: attendance._id },
          {
            $set: {
              students: existingStudents,
              updatedAt: new Date().toISOString(),
            },
          },
        );

        res.json({
          success: true,
          message: "Global Attendance Saved Successfully",
        });
      } catch (err) {
        logger.error(
          { err },
          "Legacy POST /attendence/all-stu-attendance failed",
        );
        res.status(500).json({ success: false, message: "Internal error" });
      }
    },
  );

  // ── DayBook data (overall earnings) ──
  // Legacy frontend: GET /api/dayBook/data → flat array merging manual entries + fee payments.
  // Bug fixes applied:
  //   1. Merge feepayments (student fee credits) with daybookentries (manual entries)
  //   2. rollNo field: DDD schema stores "rollNumber", legacy stored "rollNo" — handle both
  //   3. narration: handle legacy typo "naretion" stored in old documents
  gateway.get("/dayBook/data", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;

      const [entries, feePayments, accounts, commissions] = await Promise.all([
        db.collection("daybookentries").find({ tenantId }).toArray(),
        db.collection("feepayments").find({ tenantId }).toArray(),
        db.collection("daybookaccounts").find({ tenantId }).toArray(),
        db.collection("commissions").find({ tenantId }).toArray(),
      ]);

      // Build accountId → companyId and accountId → accountName lookups.
      // Old entries stored before the accountName field was added have an empty accountName,
      // so we fall back to the account's name from daybookaccounts by accountId.
      const accountCompanyMap = new Map<string, string>();
      const accountNameMap = new Map<string, string>();
      for (const acc of accounts) {
        const idKey = acc._id.toString();
        if (acc.companyId) accountCompanyMap.set(idKey, String(acc.companyId));
        if (acc.accountName) accountNameMap.set(idKey, String(acc.accountName));
        if (acc._legacyId) {
          const legKey = String(acc._legacyId);
          if (acc.companyId) accountCompanyMap.set(legKey, String(acc.companyId));
          if (acc.accountName) accountNameMap.set(legKey, String(acc.accountName));
        }
      }

      const daybookRows = entries.map((e: any) => {
        const accountKey = e.accountId || e.dayBookAccountId;
        const accountKeyStr = accountKey ? String(accountKey) : "";
        const resolvedCompanyId =
          (e.companyId ? String(e.companyId) : null) ||
          (accountKeyStr ? accountCompanyMap.get(accountKeyStr) ?? null : null);
        // Resolve accountName: prefer stored value, fall back to daybookaccounts lookup
        const resolvedAccountName =
          e.accountName ||
          (accountKeyStr ? accountNameMap.get(accountKeyStr) ?? "" : "");
        return {
          _id: e._legacyId || e._id.toString(),
          dayBookAccountId: e.dayBookAccountId || (e.accountId ? String(e.accountId) : null),
          accountName: resolvedAccountName,
          accountType: e.accountType || "",
          companyId: resolvedCompanyId,
          dayBookDatadate: e.date || e.dayBookDatadate || e.createdAt,
          debit: Number(e.debit) || 0,
          credit: Number(e.credit) || 0,
          balance: Number(e.balance) || 0,
          narration: e.narration || (e as any).naretion || "",
          naretion: (e as any).naretion || e.narration || "",
          studentLateFees: Number(e.studentLateFees) || 0,
          studentInfo: e.studentInfo ? String(e.studentInfo) : null,
          rollNo: e.rollNo || e.rollNumber || "",
          StudentName: e.StudentName || e.studentName || "",
          reciptNumber: e.reciptNumber || e.receiptNumber || "",
          linkAccountId: e.linkAccountId || "",
          linkAccountName: e.linkAccountName || "",
          linkAccountType: e.linkAccountType || "",
          linkDayBookAccountData: e.linkDayBookAccountData || "",
          createdAt: e.createdAt,
          updatedAt: e.updatedAt || e.createdAt,
        };
      });

      // Student fee payments live in feepayments — map to daybook row shape.
      // DEDUP: legacy prod creates a daybookdatas row for every fee receipt at
      // INSERT time, so migrated fees ALREADY appear in daybookentries. Adding
      // them again from feepayments would double-count credits. Only merge fees
      // whose receipt isn't already represented in daybookentries.
      const existingDaybookReceipts = new Set(
        entries
          .map((e: any) => e.reciptNumber || e.receiptNumber)
          .filter((r: any) => r && r !== ""),
      );
      const feeRows = feePayments
        .filter((f: any) => {
          const rec = f.reciptNumber || f.receiptNumber;
          return !rec || !existingDaybookReceipts.has(rec);
        })
        .map((f: any) => ({
          _id: f._legacyId || f._id.toString(),
          dayBookAccountId: null,
          accountName: "",
          companyId: f.companyId ? String(f.companyId) : null,
          dayBookDatadate: f.amountDate || f.paymentDate || f.createdAt,
          debit: 0,
          credit: Number(f.amountPaid) || 0,
          balance: 0,
          narration: f.narration || "",
          naretion: f.narration || "",
          studentLateFees: Number(f.lateFees) || Number(f.studentLateFees) || 0,
          studentInfo: f.studentId || (f.studentInfo ? String(f.studentInfo) : null),
          rollNo: f.rollNo || f.rollNumber || "",
          StudentName: f.StudentName || f.studentName || "",
          reciptNumber: f.reciptNumber || f.receiptNumber || "",
          createdAt: f.createdAt,
          updatedAt: f.updatedAt || f.createdAt,
        }));

      // Student commissions are an expense — surface them as debit rows so the
      // daybook's net revenue (credit − debit) accounts for commission payouts.
      // Cash basis: debit = amount actually paid out (commissionPaid), matching
      // how fee rows use amountPaid. Commissions with nothing paid yet are no
      // cash outflow and are skipped. companyId must be present or the row won't
      // count toward a company's daybook total (which filters by companyId).
      const commissionRows = commissions
        .filter((c: any) => (Number(c.commissionPaid) || 0) > 0)
        .map((c: any) => {
          const sname = String(c.studentName || "");
          const dashIdx = sname.lastIndexOf("-");
          const displayName = dashIdx === -1 ? sname : sname.slice(0, dashIdx);
          const roll = dashIdx === -1 ? "" : sname.slice(dashIdx + 1);
          const person = String(c.commissionPersonName || "").trim();
          const label = person ? "Commission to " + person : "Student Commission";
          return {
            _id: "commission-" + (c._legacyId || c._id.toString()),
            dayBookAccountId: null,
            accountName: "Student Commission",
            accountType: "Commission",
            companyId: c.companyId ? String(c.companyId) : null,
            dayBookDatadate: c.commissionDate || c.createdAt,
            debit: Number(c.commissionPaid) || 0,
            credit: 0,
            balance: 0,
            narration: c.narration ? String(c.narration) : label,
            naretion: c.narration ? String(c.narration) : label,
            studentLateFees: 0,
            studentInfo: null,
            rollNo: roll,
            StudentName: displayName,
            reciptNumber: c.voucherNumber || "",
            linkAccountId: "",
            linkAccountName: "",
            linkAccountType: "",
            linkDayBookAccountData: "",
            source: "commission",
            createdAt: c.createdAt,
            updatedAt: c.updatedAt || c.createdAt,
          };
        });

      // Merge and sort oldest-first (ascending by date, then by createdAt as tie-breaker)
      const allRows = [...daybookRows, ...feeRows, ...commissionRows].sort((a: any, b: any) => {
        const da = new Date(a.dayBookDatadate).getTime();
        const db = new Date(b.dayBookDatadate).getTime();
        if (da !== db) return da - db;
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });

      res.json(allRows);
    } catch (err) {
      logger.error({ err }, "Legacy dayBook/data query failed");
      res.json([]);
    }
  });

  // ── DayBook: PUT /dayBook/data/:id — update entry (legacy ID support) ──
  // The GET /dayBook/data handler returns _legacyId as _id, so the frontend
  // may send either a Mongo ObjectId or a legacy string ID. Query by both.
  gateway.put("/dayBook/data/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");
      const body = req.body as any;

      // Commission rows are synthesized from the commissions collection. Editing
      // one from the daybook maps debit → commissionPaid (and narration/date).
      if (id.startsWith("commission-")) {
        const cid = id.slice("commission-".length);
        const cOr: any[] = [{ _legacyId: cid }];
        if (mongoose.Types.ObjectId.isValid(cid))
          cOr.push({ _id: new mongoose.Types.ObjectId(cid) });
        const coll = mongoose.connection.db!.collection("commissions");
        const existing = await coll.findOne({ tenantId, $or: cOr });
        if (!existing) {
          res.status(404).json({ message: "Commission not found" });
          return;
        }
        const cSet: Record<string, any> = { updatedAt: new Date() };
        if (body.debit !== undefined) {
          const paid = Number(body.debit) || 0;
          cSet.commissionPaid = paid;
          cSet.commissionRemaining = (Number(existing.commissionAmount) || 0) - paid;
        }
        if (body.narration !== undefined) cSet.narration = String(body.narration);
        else if (body.naretion !== undefined) cSet.narration = String(body.naretion);
        if (body.dayBookDatadate || body.date)
          cSet.commissionDate = new Date(body.dayBookDatadate || body.date);
        await coll.updateOne({ _id: existing._id }, { $set: cSet });
        res.json({ ...existing, ...cSet, _id: id });
        return;
      }

      const updateFields: Record<string, any> = { updatedAt: new Date() };
      if (body.dayBookAccountId || body.accountId)
        updateFields.accountId = body.dayBookAccountId || body.accountId;
      if (body.dayBookDatadate || body.date)
        updateFields.date = body.dayBookDatadate || body.date;
      if (body.narration !== undefined) updateFields.narration = body.narration;
      if (body.naretion !== undefined && !body.narration)
        updateFields.narration = body.naretion;
      if (body.debit !== undefined) updateFields.debit = Number(body.debit) || 0;
      if (body.credit !== undefined) updateFields.credit = Number(body.credit) || 0;
      if (body.balance !== undefined) updateFields.balance = Number(body.balance) || 0;
      if (body.StudentName || body.studentName)
        updateFields.studentName = body.StudentName || body.studentName;
      if (body.rollNo || body.rollNumber)
        updateFields.rollNumber = body.rollNo || body.rollNumber;
      if (body.reciptNumber || body.receiptNumber)
        updateFields.receiptNumber = body.reciptNumber || body.receiptNumber;
      if (body.studentInfo || body.studentId)
        updateFields.studentId = body.studentInfo || body.studentId;

      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await mongoose.connection
        .db!.collection("daybookentries")
        .findOneAndUpdate(
          { tenantId, $or: orClauses },
          { $set: updateFields },
          { returnDocument: "after" },
        );

      if (!result) {
        res.status(404).json({ message: "Entry not found" });
        return;
      }
      const { _id: _rawId, ...rest } = result as any;
      res.json({
        _id: result._legacyId || _rawId.toString(),
        ...rest,
        ...updateFields,
      });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /dayBook/data/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── DayBook: DELETE /dayBook/data/:id — delete entry (legacy ID support) ──
  gateway.delete("/dayBook/data/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");

      // Commission rows are synthesized into the daybook from the commissions
      // collection (id "commission-<commissionId>"). Deleting such a row deletes
      // the underlying commission.
      if (id.startsWith("commission-")) {
        const cid = id.slice("commission-".length);
        const cOr: any[] = [{ _legacyId: cid }];
        if (mongoose.Types.ObjectId.isValid(cid))
          cOr.push({ _id: new mongoose.Types.ObjectId(cid) });
        const cRes = await mongoose.connection
          .db!.collection("commissions")
          .deleteOne({ tenantId, $or: cOr });
        if (cRes.deletedCount === 0) {
          res.status(404).json({ message: "Commission not found" });
          return;
        }
        res.json({ success: true, message: "Commission deleted" });
        return;
      }

      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await mongoose.connection
        .db!.collection("daybookentries")
        .deleteOne({ tenantId, $or: orClauses });

      if (result.deletedCount === 0) {
        res.status(404).json({ message: "Entry not found" });
        return;
      }
      res.json({ success: true, message: "Entry deleted" });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /dayBook/data/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── DayBook: POST /dayBook/addData — normalize body before DDD proxy ──
  // Normalizes "naretion" typo → "narration". The GET /dayBook/data handler resolves
  // companyId from daybookaccounts using accountId, so no extra field needed here.
  gateway.post("/dayBook/addData", (req: Request, _res: Response, next: NextFunction) => {
    if (req.body && req.body.naretion !== undefined && !req.body.narration) {
      req.body.narration = req.body.naretion;
    }
    next();
  });

  // ── DayBook: POST /dayBook/addAccount — create account with companyId ──
  gateway.post("/dayBook/addAccount", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const body = req.body as any;
      if (!body.accountName) {
        res.status(400).json({ message: "Account name is required" });
        return;
      }

      const now = new Date();
      const doc = {
        tenantId,
        accountName: body.accountName,
        accountType: body.accountType || "",
        companyId: body.companyId || null,
        // Commission accounts double as referrers; an email enables referral
        // notifications when chosen in an enquiry form's "Referred By" field.
        email: body.email || "",
        isActive: true,
        createdBy: (req as any).user?.userId || "system",
        createdAt: now,
        updatedAt: now,
      };

      const result = await mongoose.connection
        .db!.collection("daybookaccounts")
        .insertOne(doc);
      res.status(201).json({
        _id: result.insertedId.toString(),
        ...doc,
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /dayBook/addAccount failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── DayBook: GET /dayBook — account list with companyId (not in DDD model) ──
  gateway.get("/dayBook", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.json([]);
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const accounts = await mongoose.connection
        .db!.collection("daybookaccounts")
        .find({ tenantId })
        .sort({ createdAt: -1 })
        .toArray();

      res.json(
        accounts.map((a: any) => ({
          _id: a._legacyId || a._id.toString(),
          accountName: a.accountName || "",
          accountType: a.accountType || "",
          companyId: a.companyId || null,
          email: a.email || "",
          isActive: a.isActive ?? true,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt || a.createdAt,
        })),
      );
    } catch (err) {
      logger.error({ err }, "Legacy GET /dayBook accounts failed");
      res.json([]);
    }
  });

  // ── DayBook: PUT /dayBook/:id — update account (not entry) ──
  gateway.put("/dayBook/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");
      const body = req.body as any;

      const updateFields: Record<string, any> = { updatedAt: new Date() };
      if (body.accountName) updateFields.accountName = body.accountName;
      if (body.accountType) updateFields.accountType = body.accountType;
      if (body.companyId) updateFields.companyId = body.companyId;
      if (body.email !== undefined) updateFields.email = body.email;
      if (body.isActive !== undefined) updateFields.isActive = body.isActive;

      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await mongoose.connection
        .db!.collection("daybookaccounts")
        .findOneAndUpdate(
          { tenantId, $or: orClauses },
          { $set: updateFields },
          { returnDocument: "after" },
        );

      if (!result) {
        res.status(404).json({ message: "Account not found" });
        return;
      }
      res.json({
        _id: result._legacyId || result._id.toString(),
        ...updateFields,
        accountName: result.accountName,
        accountType: result.accountType,
        companyId: result.companyId,
      });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /dayBook/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── DayBook: DELETE /dayBook/:id — delete account (not entry) ──
  gateway.delete("/dayBook/:id", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const id = p(req, "id");

      // Try deleting by _id or _legacyId
      const orClauses: any[] = [{ _legacyId: id }];
      if (mongoose.Types.ObjectId.isValid(id))
        orClauses.push({ _id: new mongoose.Types.ObjectId(id) });
      const result = await mongoose.connection
        .db!.collection("daybookaccounts")
        .deleteOne({ tenantId, $or: orClauses });

      if (result.deletedCount === 0) {
        res.status(404).json({ message: "Account not found" });
        return;
      }
      res.json({ success: true, message: "Account deleted" });
    } catch (err) {
      logger.error({ err }, "Legacy DELETE /dayBook/:id failed");
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── DayBook: GET /dayBook/singleAccountDayBookLists/:id — entries filtered by account ID ──
  gateway.get(
    "/dayBook/singleAccountDayBookLists/:id",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const accountId = p(req, "id");

        // Resolve account ID — frontend may send new _id, but entries store legacy account IDs
        const matchIds: string[] = [accountId];
        if (mongoose.Types.ObjectId.isValid(accountId)) {
          const account = await db
            .collection("daybookaccounts")
            .findOne({ _id: new mongoose.Types.ObjectId(accountId), tenantId });
          if (account?._legacyId) matchIds.push(account._legacyId);
        } else {
          // accountId might be a legacyId — also check the real _id
          const account = await db
            .collection("daybookaccounts")
            .findOne({ _legacyId: accountId, tenantId });
          if (account) matchIds.push(account._id.toString());
        }

        const entries = await db
          .collection("daybookentries")
          .find({ tenantId, dayBookAccountId: { $in: matchIds } })
          .sort({ date: -1 })
          .toArray();

        res.json(
          entries.map((e: any) => ({
            _id: e._legacyId || e._id.toString(),
            dayBookAccountId: e.dayBookAccountId
              ? String(e.dayBookAccountId)
              : null,
            accountName: e.accountName || "",
            companyId: e.companyId ? String(e.companyId) : null,
            dayBookDatadate: e.date || e.dayBookDatadate || e.createdAt,
            debit: Number(e.debit) || 0,
            credit: Number(e.credit) || 0,
            balance: Number(e.balance) || 0,
            narration: e.narration || "",
            studentLateFees: Number(e.studentLateFees) || 0,
            studentInfo: e.studentInfo ? String(e.studentInfo) : null,
            rollNo: e.rollNo || "",
            StudentName: e.StudentName || e.studentName || "",
            reciptNumber: e.reciptNumber || e.receiptNumber || "",
            createdAt: e.createdAt,
            updatedAt: e.updatedAt || e.createdAt,
          })),
        );
      } catch (err) {
        logger.error(
          { err },
          "Legacy dayBook/singleAccountDayBookLists GET failed",
        );
        res.json([]);
      }
    },
  );

  // ── Show Student Dashboard (all flagged students) ──
  // Legacy frontend: GET /api/student-issues/showStudentDashboard → expects array of { _id, studentId, showStudent, studentName }
  // DDD collection: issuedashboards (migrated from showstudentdashboards)
  gateway.get(
    "/student-issues/showStudentDashboard",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;

        const dashboards = await db
          .collection("issuedashboards")
          .find({ tenantId })
          .toArray();

        res.json(
          dashboards.map((d: any) => ({
            _id: d._legacyId || d._id.toString(),
            studentId: d.studentId ? String(d.studentId) : "",
            showStudent: d.showStudent ?? false,
            studentName: d.studentName || "",
            __v: 0,
          })),
        );
      } catch (err) {
        logger.error({ err }, "Legacy showStudentDashboard list query failed");
        res.json([]);
      }
    },
  );

  // ── POST: Toggle student flag on dashboard ──
  gateway.post(
    "/student-issues/showStudentDashboard",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ success: false, error: "Unauthorized" });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const body = req.body as any;

        const studentId = body.studentId ? String(body.studentId) : "";
        if (!studentId) {
          res
            .status(400)
            .json({ success: false, message: "studentId required" });
          return;
        }

        // Upsert: toggle or create
        const existing = await db
          .collection("issuedashboards")
          .findOne({ tenantId, studentId });
        if (existing) {
          const newVal =
            body.showStudent !== undefined
              ? Boolean(body.showStudent)
              : !existing.showStudent;
          await db.collection("issuedashboards").updateOne(
            { _id: existing._id },
            {
              $set: {
                showStudent: newVal,
                updatedAt: new Date().toISOString(),
              },
            },
          );
          res.json({
            success: true,
            message: newVal
              ? "Student flagged on dashboard"
              : "Student removed from dashboard",
          });
        } else {
          await db.collection("issuedashboards").insertOne({
            tenantId,
            studentId,
            showStudent:
              body.showStudent !== undefined ? Boolean(body.showStudent) : true,
            studentName: body.studentName || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          res.json({ success: true, message: "Student flagged on dashboard" });
        }
      } catch (err) {
        logger.error({ err }, "Legacy showStudentDashboard POST failed");
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    },
  );

  // ── GET /subjects/marks/:studentId/:courseId — student marks for a specific course ──
  // Legacy frontend calls /api/subjects/marks/:studentId/:courseId to get marks with populated subjects.
  // DDD stores marks in 'studentmarks' collection (inline subjects) and legacy in 'studentsubjectmarks'.
  gateway.get(
    "/subjects/marks/:studentId/:courseId",
    async (req: Request, res: Response) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json({ success: true, data: [] });
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const { studentId, courseId } = req.params as {
          studentId: string;
          courseId: string;
        };

        // Resolve student: find by _legacyId or _id
        const stuOr: any[] = [{ _legacyId: studentId }];
        if (mongoose.Types.ObjectId.isValid(studentId))
          stuOr.push({ _id: new mongoose.Types.ObjectId(studentId) });
        const student = await db
          .collection("students")
          .findOne({ tenantId, $or: stuOr });
        const stuIdVariants = new Set([studentId]);
        if (student) {
          stuIdVariants.add(student._id.toString());
          if (student._legacyId) stuIdVariants.add(String(student._legacyId));
        }

        // Resolve course: find by _legacyId or _id
        const cOr: any[] = [{ _legacyId: courseId }];
        if (mongoose.Types.ObjectId.isValid(courseId))
          cOr.push({ _id: new mongoose.Types.ObjectId(courseId) });
        const courseDoc = await db
          .collection("courses")
          .findOne({ tenantId, $or: cOr });
        const cIdVariants = new Set([courseId]);
        if (courseDoc) {
          cIdVariants.add(courseDoc._id.toString());
          if (courseDoc._legacyId) cIdVariants.add(String(courseDoc._legacyId));
        }

        const stuIds = [...stuIdVariants];
        const cIds = [...cIdVariants];
        const stuLegacyId = student
          ? student._legacyId
            ? String(student._legacyId)
            : student._id.toString()
          : studentId;
        const cLegacyId = courseDoc
          ? courseDoc._legacyId
            ? String(courseDoc._legacyId)
            : courseDoc._id.toString()
          : courseId;
        const studentName = student
          ? student.firstName
            ? [student.firstName, student.lastName].filter(Boolean).join(" ")
            : student.name || ""
          : "";
        const courseName = courseDoc
          ? courseDoc.name || courseDoc.courseName || ""
          : "";

        // Try legacy collection first (studentsubjectmarks) — already has populated subject refs
        const stuOids = stuIds
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => new mongoose.Types.ObjectId(id));
        const cOids = cIds
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => new mongoose.Types.ObjectId(id));
        let legacyDoc: any = null;
        if (stuOids.length && cOids.length) {
          legacyDoc = await db.collection("studentsubjectmarks").findOne({
            studentInfo: { $in: stuOids.length ? stuOids : [] },
            course: { $in: cOids.length ? cOids : [] },
          });
        }
        if (legacyDoc) {
          res.json({ success: true, data: [legacyDoc] });
          return;
        }

        // Try DDD studentmarks collection
        let marksDoc: any = null;
        for (const sId of stuIds) {
          for (const cId of cIds) {
            marksDoc = await db
              .collection("studentmarks")
              .findOne({ tenantId, studentId: sId, courseId: cId });
            if (marksDoc) break;
          }
          if (marksDoc) break;
        }

        if (!marksDoc) {
          res.json({ success: true, data: [] });
          return;
        }

        // Look up subjects to enrich inline mark entries with subject _id
        const subjectOr: any[] = cIds.map((id: string) => ({ courseId: id }));
        for (const id of cIds) {
          if (mongoose.Types.ObjectId.isValid(id))
            subjectOr.push({ course: new mongoose.Types.ObjectId(id) });
        }
        const subjectDocs = subjectOr.length
          ? await db
              .collection("subjects")
              .find({ tenantId, $or: subjectOr })
              .toArray()
          : [];
        const subjectByName = new Map(
          subjectDocs.map((s: any) => [s.subjectName, s]),
        );
        const subjectByCode = new Map(
          subjectDocs.map((s: any) => [s.subjectCode, s]),
        );

        const subjects = (marksDoc.subjects || []).map((item: any) => {
          const subDoc =
            subjectByName.get(item.subjectName) ||
            subjectByCode.get(item.subjectCode);
          return {
            subject: subDoc
              ? {
                  _id: subDoc._id.toString(),
                  subjectName: subDoc.subjectName,
                  subjectCode: subDoc.subjectCode,
                  fullMarks: subDoc.fullMarks || 100,
                  passMarks: subDoc.passMarks || 40,
                }
              : {
                  _id: item.subjectCode || item.subjectName,
                  subjectName: item.subjectName,
                  subjectCode: item.subjectCode,
                },
            theory: item.theory || 0,
            practical: item.practical || 0,
            totalMarks: item.totalMarks || 0,
            isActive: item.isActive !== false,
          };
        });

        res.json({
          success: true,
          data: [
            {
              _id: marksDoc._id.toString(),
              studentInfo: {
                _id: stuLegacyId,
                name: studentName,
                rollNumber: student?.rollNumber || "",
              },
              course: { _id: cLegacyId, courseName },
              subjects,
              resultStatus: marksDoc.resultStatus || "NotStarted",
              createdAt: marksDoc.createdAt,
              updatedAt: marksDoc.updatedAt,
            },
          ],
        });
      } catch (err) {
        logger.error(
          { err },
          "Legacy GET /subjects/marks/:studentId/:courseId failed",
        );
        res.json({ success: true, data: [] });
      }
    },
  );

  // ── GET /subjects/:courseId — subjects for a course ──
  // Legacy frontend calls /api/subjects/:courseId to list subjects for that course.
  // Guard: /subjects/marks is handled by routeMappings (returns all marks), so skip it.
  gateway.get(
    "/subjects/:courseId",
    async (req: Request, res: Response, next: NextFunction) => {
      if (p(req, "courseId") === "marks") {
        next();
        return;
      }
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.json([]);
          return;
        }
        const { default: mongoose } = await import("mongoose");
        const db = mongoose.connection.db!;
        const courseId = p(req, "courseId");

        // Resolve course to get all ID variants
        const courseOr: any[] = [{ _legacyId: courseId }];
        if (mongoose.Types.ObjectId.isValid(courseId))
          courseOr.push({ _id: new mongoose.Types.ObjectId(courseId) });
        const courseDoc = await db
          .collection("courses")
          .findOne({ tenantId, $or: courseOr });

        const cIdVariants = new Set([courseId]);
        if (courseDoc) {
          cIdVariants.add(courseDoc._id.toString());
          if (courseDoc._legacyId) cIdVariants.add(String(courseDoc._legacyId));
        }

        // Build $or clauses to match DDD (courseId string) and legacy (course ObjectId) formats
        const subjectOr: any[] = [];
        for (const id of cIdVariants) {
          subjectOr.push({ courseId: id });
          if (mongoose.Types.ObjectId.isValid(id))
            subjectOr.push({ course: new mongoose.Types.ObjectId(id) });
        }

        const subjects = await db
          .collection("subjects")
          .find({ $or: subjectOr })
          .sort({ createdAt: 1 })
          .toArray();

        res.json(
          subjects.map((s: any) => ({
            _id: s._id.toString(),
            course: courseId,
            subjectName: s.subjectName || "",
            subjectCode: s.subjectCode || "",
            fullMarks: s.fullMarks || 0,
            passMarks: s.passMarks || 0,
            semYear: s.semYear || "",
            addedBy: s.addedBy || "",
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            __v: 0,
          })),
        );
      } catch (err) {
        logger.error({ err }, "Legacy GET /subjects/:courseId failed");
        res.json([]);
      }
    },
  );

  // ── PUT /students/:id — update student (course, fees, personal info) ──
  // Frontend sends multipart FormData with legacy flat fields.
  // routeMappings forwards to DDD which expects JSON + DDD field names → always fails.
  // This handler parses FormData, maps to DDD fields, updates MongoDB directly.
  gateway.put(
    "/students/:id",
    async (req: Request, res: Response, _next: NextFunction) => {
      try {
        const tenantId = (req as any).tenantContext?.tenantId;
        if (!tenantId || tenantId === "__unauthenticated__") {
          res.status(401).json({ success: false, message: "Unauthorized" });
          return;
        }

        const { default: multer } = await import("multer");
        const { default: path } = await import("path");
        const { default: fs } = await import("fs");
        const { default: mongoose } = await import("mongoose");

        const uploadDir = path.join(process.cwd(), "uploads", "students");
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });

        const storage = multer.diskStorage({
          destination: (_req, _file, cb) => cb(null, uploadDir),
          filename: (_req, file, cb) =>
            cb(null, `student-${Date.now()}${path.extname(file.originalname)}`),
        });
        const upload = multer({
          storage,
          limits: { fileSize: 5 * 1024 * 1024 },
        }).single("image");

        upload(req, res, async (uploadErr) => {
          if (uploadErr) {
            res.status(400).json({ message: uploadErr.message });
            return;
          }

          const body = req.body as any;
          const legacyId = p(req, "id");
          const db = mongoose.connection.db!;
          logger.info(
            {
              legacyId,
              courseName: body.courseName,
              select_course: body.select_course,
              name: body.name,
              message: body.message,
              courseduration: body.courseduration,
              bodyKeys: Object.keys(body).join(","),
            },
            "PUT /students/:id - received fields",
          );

          // Find student by _legacyId or _id
          const orClauses: any[] = [{ _legacyId: legacyId }];
          if (mongoose.Types.ObjectId.isValid(legacyId))
            orClauses.push({ _id: new mongoose.Types.ObjectId(legacyId) });
          const student = await db
            .collection("students")
            .findOne({ tenantId, $or: orClauses });

          if (!student) {
            res.status(404).json({
              success: false,
              message: `Student ${legacyId} not found`,
            });
            return;
          }

          // Map legacy name → firstName + lastName
          const fullName = (body.name || "").trim();
          if (fullName) {
            const parts = fullName.split(" ");
            (student as any)._newFirstName = parts[0] || "";
            (student as any)._newLastName = parts.slice(1).join(" ") || "";
          }

          // Build enrollment update (merge with existing)
          const enrollmentUpdate: any = { ...(student.enrollment || {}) };

          // body.courseName = course _legacyId or _id (may be empty if g was never set)
          // body.select_course = course name string from the dropdown value
          // Try courseName first (if it's a valid ID), then fallback to finding course by name via select_course
          const rawCourseName = body.courseName ? String(body.courseName) : "";
          const isInvalidCourseName =
            !rawCourseName ||
            rawCourseName === "[object Object]" ||
            rawCourseName.startsWith("{") ||
            rawCourseName.startsWith("[");
          let newCourseId = isInvalidCourseName ? null : rawCourseName;
          const newCourseName =
            body.select_course &&
            body.select_course !== enrollmentUpdate.courseName
              ? String(body.select_course)
              : null;

          if (newCourseId) {
            const cOr: any[] = [{ _legacyId: newCourseId }];
            if (mongoose.Types.ObjectId.isValid(newCourseId))
              cOr.push({ _id: new mongoose.Types.ObjectId(newCourseId) });
            const courseDoc = await db
              .collection("courses")
              .findOne({ tenantId, $or: cOr });
            enrollmentUpdate.courseId =
              courseDoc?._id?.toString() || newCourseId;
            enrollmentUpdate.courseName =
              body.select_course ||
              courseDoc?.name ||
              courseDoc?.courseName ||
              enrollmentUpdate.courseName;
          } else if (newCourseName) {
            // Course changed by name (dropdown value is courseName, not _id)
            const courseDoc = await db.collection("courses").findOne({
              tenantId,
              $or: [{ name: newCourseName }, { courseName: newCourseName }],
            });
            if (courseDoc) {
              enrollmentUpdate.courseId = courseDoc._id.toString();
              enrollmentUpdate.courseName =
                courseDoc.name || courseDoc.courseName || newCourseName;
              enrollmentUpdate.courseFees =
                courseDoc.fees ||
                courseDoc.courseFees ||
                enrollmentUpdate.courseFees;
            } else {
              enrollmentUpdate.courseName = newCourseName;
            }
          }

          if (body.course_fees !== undefined && body.course_fees !== "")
            enrollmentUpdate.courseFees = Number(body.course_fees) || 0;
          if (body.discount !== undefined && body.discount !== "")
            enrollmentUpdate.discount = Number(body.discount) || 0;
          if (body.netCourseFees !== undefined && body.netCourseFees !== "") {
            enrollmentUpdate.netFees = Number(body.netCourseFees) || 0;
            enrollmentUpdate.remainingFees =
              Number(body.remainingCourseFees) ||
              Number(body.netCourseFees) ||
              enrollmentUpdate.remainingFees ||
              0;
          }
          if (body.date_of_joining)
            enrollmentUpdate.dateOfJoining = new Date(body.date_of_joining);
          if (
            body.no_of_installments !== undefined &&
            body.no_of_installments !== ""
          )
            enrollmentUpdate.installmentCount =
              Number(body.no_of_installments) || 0;
          if (
            body.no_of_installments_amount !== undefined &&
            body.no_of_installments_amount !== ""
          )
            enrollmentUpdate.installmentAmount =
              Number(body.no_of_installments_amount) || 0;

          // Build contact update
          const contactUpdate: any = { ...(student.contact || {}) };
          if (body.mobile_number) contactUpdate.mobile = body.mobile_number;
          if (body.phone_number) contactUpdate.phone = body.phone_number;
          if (body.email && body.email !== "[object Object]")
            contactUpdate.email = body.email;
          if (body.present_address)
            contactUpdate.address = body.present_address;
          if (body.city) contactUpdate.city = body.city;

          const updateFields: any = {
            updatedAt: new Date(),
            contact: contactUpdate,
            enrollment: enrollmentUpdate,
          };
          if ((student as any)._newFirstName)
            updateFields.firstName = (student as any)._newFirstName;
          if ((student as any)._newLastName !== undefined)
            updateFields.lastName = (student as any)._newLastName;
          if (body.father_name) updateFields.fatherName = body.father_name;
          if (body.date_of_birth)
            updateFields.dateOfBirth = new Date(body.date_of_birth);
          if (body.education_qualification)
            updateFields.educationQualification = body.education_qualification;
          if ((req as any).file)
            updateFields.image = `students/${(req as any).file.filename}`;
          // Store course remainder duration and update message
          if (body.courseduration !== undefined)
            updateFields.courseduration = body.courseduration;
          if (body.courseRemainderDuration !== undefined)
            updateFields.courseDuration = body.courseRemainderDuration;
          if (body.courseDuration !== undefined)
            updateFields.courseDuration = body.courseDuration;
          if (body.message) updateFields.message = body.message;
          if (body.installment_duration)
            updateFields.installment_duration = body.installment_duration;
          // Preserve legacy flat fields
          if (body.select_course)
            updateFields.select_course = body.select_course;
          if (body.course_fees !== undefined)
            updateFields.course_fees = Number(body.course_fees) || 0;
          if (body.discount !== undefined)
            updateFields.discount = Number(body.discount) || 0;
          if (body.netCourseFees !== undefined)
            updateFields.netCourseFees = Number(body.netCourseFees) || 0;
          if (body.remainingCourseFees !== undefined)
            updateFields.remainingCourseFees =
              Number(body.remainingCourseFees) || 0;
          if (body.no_of_installments !== undefined)
            updateFields.no_of_installments =
              Number(body.no_of_installments) || 0;
          if (body.no_of_installments_amount !== undefined)
            updateFields.no_of_installments_amount =
              Number(body.no_of_installments_amount) || 0;
          // Fixed installment mode fields
          if (body.admission_fees !== undefined)
            updateFields.admission_fees = Number(body.admission_fees) || 0;
          if (body.fixed_installment !== undefined)
            updateFields.fixed_installment = String(body.fixed_installment || "");
          if (body.batch_starting_fees !== undefined)
            updateFields.batch_starting_fees = Number(body.batch_starting_fees) || 0;
          if (body.date_of_joining)
            updateFields.date_of_joining = body.date_of_joining;
          if (body.totalPaid !== undefined)
            updateFields.totalPaid = Number(body.totalPaid) || 0;

          // Tenant-defined custom admission fields (Personal Details section). The
          // frontend sends them as a JSON object in `customFields` (same shape as the
          // create path). Merge with the student's existing values so a partial update
          // never wipes previously-saved fields, and enforce mandatory ones server-side
          // (scoped to the student's company, stored in `companyName`).
          if (body.customFields !== undefined) {
            let cfUpdate: Record<string, unknown> | null = null;
            try {
              const parsed =
                typeof body.customFields === "string"
                  ? JSON.parse(body.customFields)
                  : body.customFields;
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                cfUpdate = parsed as Record<string, unknown>;
              }
            } catch {
              /* ignore malformed customFields */
            }
            if (cfUpdate) {
              const merged = {
                ...((student as any).customFields || {}),
                ...cfUpdate,
              };
              const mandatoryDefs = await db
                .collection("customfields")
                .find({
                  tenantId,
                  companyId: (student as any).companyName,
                  formType: "admission",
                  mandatory: true,
                })
                .toArray();
              for (const def of mandatoryDefs) {
                const v = (merged as Record<string, unknown>)[def.fieldName];
                if (v === undefined || v === null || String(v).trim() === "") {
                  res.status(400).json({
                    success: false,
                    message: `${def.fieldName} is required`,
                  });
                  return;
                }
              }
              updateFields.customFields = merged;
            }
          }

          logger.info(
            {
              studentId: student._id,
              updateKeys: Object.keys(updateFields).join(","),
            },
            "DEBUG: PUT /students/:id - updating",
          );
          await db
            .collection("students")
            .updateOne({ _id: student._id }, { $set: updateFields });

          // Return updated student in legacy format
          const updated = await db
            .collection("students")
            .findOne({ _id: student._id });
          const courseMap = await loadCourseMap(tenantId);
          const legacy = mapStudentToLegacy(updated, courseMap);

          logger.info(
            { studentId: student._id, legacyName: legacy?.name, success: true },
            "DEBUG: PUT /students/:id - success",
          );
          res.status(200).json(legacy);
        });
      } catch (err) {
        logger.error({ err }, "Legacy PUT /students/:id failed");
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    },
  );

  // ── PUT /subjects/marks/bulk — bulk upsert student subject marks ──
  // Frontend sends: { studentId, courseId, subjects: [{ subjectId (= _id of subject doc), theory, practical, totalMarks }] }
  // DDD BulkUpdateMarks tries to match subjectId against subjectCode/subjectName — doesn't work with ObjectId strings.
  // This handler resolves subject docs by _id, then upserts into the studentmarks collection directly.
  gateway.put("/subjects/marks/bulk", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const { studentId, courseId, subjects } = req.body as {
        studentId: string;
        courseId: string;
        subjects: Array<{
          subjectId: string;
          theory: number;
          practical: number;
          totalMarks?: number;
        }>;
      };

      if (!studentId || !courseId || !subjects?.length) {
        res.status(400).json({
          success: false,
          message: "studentId, courseId and subjects are required",
        });
        return;
      }

      // Resolve student ID variants
      const stuOr: any[] = [{ _legacyId: studentId }];
      if (mongoose.Types.ObjectId.isValid(studentId))
        stuOr.push({ _id: new mongoose.Types.ObjectId(studentId) });
      const student = await db
        .collection("students")
        .findOne({ tenantId, $or: stuOr });
      const stuIdVariants = new Set([studentId]);
      if (student) {
        stuIdVariants.add(student._id.toString());
        if (student._legacyId) stuIdVariants.add(String(student._legacyId));
      }
      const canonicalStudentId = student
        ? student._legacyId
          ? String(student._legacyId)
          : student._id.toString()
        : studentId;

      // Resolve course ID variants
      const cOr: any[] = [{ _legacyId: courseId }];
      if (mongoose.Types.ObjectId.isValid(courseId))
        cOr.push({ _id: new mongoose.Types.ObjectId(courseId) });
      const courseDoc = await db
        .collection("courses")
        .findOne({ tenantId, $or: cOr });
      const cIdVariants = new Set([courseId]);
      if (courseDoc) {
        cIdVariants.add(courseDoc._id.toString());
        if (courseDoc._legacyId) cIdVariants.add(String(courseDoc._legacyId));
      }
      const canonicalCourseId = courseDoc
        ? courseDoc._legacyId
          ? String(courseDoc._legacyId)
          : courseDoc._id.toString()
        : courseId;

      // Resolve subjects by _id to get subjectName + subjectCode
      const subjectOids = subjects
        .filter((s) => mongoose.Types.ObjectId.isValid(s.subjectId))
        .map((s) => new mongoose.Types.ObjectId(s.subjectId));
      const subjectDocs = subjectOids.length
        ? await db
            .collection("subjects")
            .find({ tenantId, _id: { $in: subjectOids } })
            .toArray()
        : [];
      const subjectById = new Map(
        subjectDocs.map((s: any) => [s._id.toString(), s]),
      );

      // Find existing marks doc across all ID variants
      let marksDoc: any = null;
      for (const sId of stuIdVariants) {
        for (const cId of cIdVariants) {
          marksDoc = await db
            .collection("studentmarks")
            .findOne({ tenantId, studentId: sId, courseId: cId });
          if (marksDoc) break;
        }
        if (marksDoc) break;
      }

      if (!marksDoc) {
        // No marks doc yet — create one with the submitted marks
        const initialSubjects = subjects.map((item) => {
          const subDoc = subjectById.get(item.subjectId);
          const theory = item.theory ?? 0;
          const practical = item.practical ?? 0;
          return {
            subjectName: subDoc?.subjectName || item.subjectId,
            subjectCode: subDoc?.subjectCode || item.subjectId,
            theory,
            practical,
            totalMarks: theory + practical || null,
            isActive: true,
          };
        });
        const anyStarted = initialSubjects.some((s) => (s.totalMarks ?? 0) > 0);
        const allCompleted = initialSubjects.every(
          (s) => s.totalMarks !== null,
        );
        const newDoc = {
          _id: new mongoose.Types.ObjectId(),
          tenantId,
          studentId: canonicalStudentId,
          courseId: canonicalCourseId,
          subjects: initialSubjects,
          resultStatus: allCompleted
            ? "Completed"
            : anyStarted
              ? "InProgress"
              : "NotStarted",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.collection("studentmarks").insertOne(newDoc);
        res.json({ success: true, message: "Marks saved successfully" });
        return;
      }

      // Update existing doc — match by subjectCode, upsert
      const existingSubjects: any[] = marksDoc.subjects || [];
      for (const item of subjects) {
        const subDoc = subjectById.get(item.subjectId);
        if (!subDoc) continue;
        const theory = item.theory ?? 0;
        const practical = item.practical ?? 0;
        const totalMarks = theory + practical;
        const idx = existingSubjects.findIndex(
          (s: any) =>
            s.subjectCode === subDoc.subjectCode ||
            s.subjectName === subDoc.subjectName,
        );
        if (idx >= 0) {
          existingSubjects[idx].theory = theory;
          existingSubjects[idx].practical = practical;
          existingSubjects[idx].totalMarks = totalMarks;
        } else {
          existingSubjects.push({
            subjectName: subDoc.subjectName,
            subjectCode: subDoc.subjectCode,
            theory,
            practical,
            totalMarks,
            isActive: true,
          });
        }
      }

      const anyStarted = existingSubjects.some(
        (s: any) => (s.totalMarks ?? 0) > 0,
      );
      const allCompleted = existingSubjects.every(
        (s: any) => s.totalMarks !== null,
      );
      await db.collection("studentmarks").updateOne(
        { _id: marksDoc._id },
        {
          $set: {
            subjects: existingSubjects,
            resultStatus: allCompleted
              ? "Completed"
              : anyStarted
                ? "InProgress"
                : "NotStarted",
            updatedAt: new Date(),
          },
        },
      );

      res.json({ success: true, message: "Marks updated successfully" });
    } catch (err) {
      logger.error({ err }, "Legacy PUT /subjects/marks/bulk failed");
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  // ── POST /subjects/add — assign subjects to student (create/update studentmarks record) ──
  // Frontend sends: { studentId, courseId, subjectIds: [ObjectId strings], courseCategoryId, companyName }
  // routeMappings incorrectly maps this to POST /api/v1/subjects (create-subject), so handle it here directly.
  gateway.post("/subjects/add", async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).tenantContext?.tenantId;
      if (!tenantId || tenantId === "__unauthenticated__") {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const { default: mongoose } = await import("mongoose");
      const db = mongoose.connection.db!;
      const { studentId, courseId, subjectIds } = req.body as {
        studentId: string;
        courseId: string;
        subjectIds: string[];
      };

      if (!studentId || !courseId || !subjectIds?.length) {
        res.status(400).json({
          success: false,
          message: "studentId, courseId and subjectIds are required",
        });
        return;
      }

      // Resolve student
      const stuOr: any[] = [{ _legacyId: studentId }];
      if (mongoose.Types.ObjectId.isValid(studentId))
        stuOr.push({ _id: new mongoose.Types.ObjectId(studentId) });
      const student = await db
        .collection("students")
        .findOne({ tenantId, $or: stuOr });
      const stuIdVariants = new Set([studentId]);
      if (student) {
        stuIdVariants.add(student._id.toString());
        if (student._legacyId) stuIdVariants.add(String(student._legacyId));
      }
      const canonicalStudentId = student
        ? student._legacyId
          ? String(student._legacyId)
          : student._id.toString()
        : studentId;

      // Resolve course
      const cOr: any[] = [{ _legacyId: courseId }];
      if (mongoose.Types.ObjectId.isValid(courseId))
        cOr.push({ _id: new mongoose.Types.ObjectId(courseId) });
      const courseDoc = await db
        .collection("courses")
        .findOne({ tenantId, $or: cOr });
      const cIdVariants = new Set([courseId]);
      if (courseDoc) {
        cIdVariants.add(courseDoc._id.toString());
        if (courseDoc._legacyId) cIdVariants.add(String(courseDoc._legacyId));
      }
      const canonicalCourseId = courseDoc
        ? courseDoc._legacyId
          ? String(courseDoc._legacyId)
          : courseDoc._id.toString()
        : courseId;

      // Look up subjects by _id
      const subjectOids = subjectIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      const subjectDocs = subjectOids.length
        ? await db
            .collection("subjects")
            .find({ tenantId, _id: { $in: subjectOids } })
            .toArray()
        : [];
      const subjectById = new Map(
        subjectDocs.map((s: any) => [s._id.toString(), s]),
      );

      // Find existing marks doc
      let marksDoc: any = null;
      for (const sId of stuIdVariants) {
        for (const cId of cIdVariants) {
          marksDoc = await db
            .collection("studentmarks")
            .findOne({ tenantId, studentId: sId, courseId: cId });
          if (marksDoc) break;
        }
        if (marksDoc) break;
      }

      if (!marksDoc) {
        const subjects = subjectIds.map((id) => {
          const subDoc = subjectById.get(id);
          return {
            subjectName: subDoc?.subjectName || id,
            subjectCode: subDoc?.subjectCode || id,
            theory: null,
            practical: null,
            totalMarks: null,
            isActive: true,
          };
        });
        const newDoc = {
          _id: new mongoose.Types.ObjectId(),
          tenantId,
          studentId: canonicalStudentId,
          courseId: canonicalCourseId,
          subjects,
          resultStatus: "NotStarted",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.collection("studentmarks").insertOne(newDoc);
        res.json({
          success: true,
          message: "Subjects assigned to student successfully",
        });
        return;
      }

      // Update existing — add subjects not already present (by subjectCode)
      const existingCodes = new Set(
        (marksDoc.subjects || []).map((s: any) => s.subjectCode),
      );
      const toAdd: any[] = [];
      for (const id of subjectIds) {
        const subDoc = subjectById.get(id);
        if (subDoc && !existingCodes.has(subDoc.subjectCode)) {
          toAdd.push({
            subjectName: subDoc.subjectName,
            subjectCode: subDoc.subjectCode,
            theory: null,
            practical: null,
            totalMarks: null,
            isActive: true,
          });
        }
      }
      if (toAdd.length) {
        await db.collection("studentmarks").updateOne(
          { _id: marksDoc._id },
          {
            $push: { subjects: { $each: toAdd } } as any,
            $set: { updatedAt: new Date() },
          },
        );
      }
      res.json({
        success: true,
        message: "Subjects assigned to student successfully",
      });
    } catch (err) {
      logger.error({ err }, "Legacy POST /subjects/add failed");
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  });

  for (const mapping of routeMappings) {
    const method = mapping.legacyMethod.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch";

    gateway[method](
      mapping.legacyPath,
      (req: Request, res: Response, next: NextFunction) => {
        // Build new URL replacing :param placeholders with actual values
        let newUrl = mapping.newPath;
        const extractedParams = mapping.paramExtractor
          ? mapping.paramExtractor(req)
          : {};
        const allParams = { ...extractedParams, ...req.params };
        for (const [key, value] of Object.entries(allParams)) {
          // Only substitute if value is a non-empty, non-undefined string
          if (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value !== "undefined"
          ) {
            newUrl = newUrl.replace(`:${key}`, String(value));
          }
        }

        // Guard: if any :placeholder was not resolved, the required ID is missing
        if (
          newUrl.includes(":") ||
          newUrl.includes("/undefined/") ||
          newUrl.endsWith("/undefined")
        ) {
          logger.warn(
            { legacyPath: mapping.legacyPath, newUrl, body: req.body },
            "Legacy gateway: unresolved param — cannot route",
          );
          res.status(400).json({
            success: false,
            error: {
              code: "MISSING_PARAM",
              message: "Required ID missing in request body",
            },
          });
          return;
        }

        // Carry query string forward
        const queryString = req.url.includes("?")
          ? req.url.substring(req.url.indexOf("?"))
          : "";
        const finalUrl = newUrl + queryString;

        // If method changed (e.g., GET→PATCH), override it
        const newMethod =
          mapping.newMethod?.toUpperCase() || mapping.legacyMethod;
        if (newMethod !== req.method) {
          req.method = newMethod;
        }

        logger.debug(
          {
            from: `${req.method} /api${req.path}`,
            to: `${newMethod} ${finalUrl}`,
          },
          "Legacy gateway: rewriting route",
        );

        // Unauthenticated GET — return empty array before hitting authGuard.
        // This prevents 401 floods from React Query when session is expired/missing.
        if (
          method === "get" &&
          (req as any).tenantContext?.tenantId === "__unauthenticated__"
        ) {
          res.json([]);
          return;
        }

        // ── Request body transformation for legacy → DDD field names ──
        if (mapping.bodyTransformer && req.body) {
          req.body = mapping.bodyTransformer(req.body);
        }

        // ── Response transformation for legacy frontend compatibility ──
        // Strip { success, data: {...} } envelope → return inner data with id→_id mapping.
        const originalJson = res.json.bind(res);
        res.json = function (body: any) {
          let result = body;

          // Unwrap DDD envelope: { success: true, data: { ... } } → inner data object
          // Skip unwrap when frontend reads res.data.success directly (e.g. mail routes)
          if (
            !mapping.keepEnvelope &&
            result?.success !== undefined &&
            result?.data !== undefined
          ) {
            result = result.data;
          }

          // The old API returned plain arrays for all list endpoints (no pagination wrapper).
          // Extract the first array from the inner data object.
          // Exception: /students → frontend reads .data.users, so keep as { users: [...] }.
          if (result && typeof result === "object" && !Array.isArray(result)) {
            const keys = Object.keys(result);
            const arrayKey = keys.find((k) => Array.isArray(result[k]));
            if (arrayKey) {
              const isStudentsList =
                arrayKey === "students" || arrayKey === "users";
              if (isStudentsList) {
                // Map each student to legacy field names, keep { users: [...] } wrapper
                result = { users: result[arrayKey].map(mapStudentToLegacy) };
              } else {
                // Extract plain array for all other endpoints
                result = result[arrayKey];
              }
            }
          }

          // For single student GET (not array), apply student mapping
          if (
            result &&
            typeof result === "object" &&
            !Array.isArray(result) &&
            result.firstName !== undefined
          ) {
            result = mapStudentToLegacy(result);
          }

          // Map `id` → `_id` and key aliases recursively (skip students, already mapped)
          if (!result?.users) {
            result = mapIdsDeep(result);
          }

          return originalJson(result);
        } as any;

        // Rewrite the URL and let Express re-route
        req.url = finalUrl;
        req.app._router.handle(req, res, next);
      },
    );
  }

  // Catch-all: log unmapped legacy routes
  gateway.all("*", (req: Request, _res: Response, next: NextFunction) => {
    logger.warn(
      { method: req.method, path: `/api${req.path}` },
      "Legacy gateway: unmapped route — falling through",
    );
    next();
  });

  return gateway;
}
