import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { EnrollStudent } from '../application/EnrollStudent.js';
import { GetStudent } from '../application/GetStudent.js';
import { ListStudents } from '../application/ListStudents.js';
import { UpdateStudent } from '../application/UpdateStudent.js';
import { DropOutStudent } from '../application/DropOutStudent.js';
import { DeleteStudent } from '../application/DeleteStudent.js';
import { RenewStudent } from '../application/RenewStudent.js';
import { FindStudentByEmail } from '../application/FindStudentByEmail.js';
import { ListStudentsByCompany } from '../application/ListStudentsByCompany.js';
import { ListStudentsByCompanyCourse } from '../application/ListStudentsByCompanyCourse.js';
import { ListStudentsForFeesCollection } from '../application/ListStudentsForFeesCollection.js';
import { SendWarningMail } from '../application/SendWarningMail.js';
import { SendCancellationMail } from '../application/SendCancellationMail.js';
import { SendBulkMail } from '../application/SendBulkMail.js';
import { SendCourseChangeMail } from '../application/SendCourseChangeMail.js';
import { CreateStudentAlert } from '../application/CreateStudentAlert.js';
import { ListStudentAlerts } from '../application/ListStudentAlerts.js';
import { UpdateStudentAlert } from '../application/UpdateStudentAlert.js';
import { DeleteStudentAlert } from '../application/DeleteStudentAlert.js';
import { UploadStudentPhoto } from '../application/UploadStudentPhoto.js';
import { MongoStudentRepository } from '../infrastructure/MongoStudentRepository.js';
import { MongoStudentAlertRepository } from '../infrastructure/MongoStudentAlertRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';
import type { StudentStatus } from '../domain/entities/Student.js';

const studentRepo = new MongoStudentRepository();
const alertRepo = new MongoStudentAlertRepository();

export class StudentController {
  async enroll(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new EnrollStudent(studentRepo);
      const result = await useCase.execute({
        tenantId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        fatherName: req.body.fatherName,
        contact: req.body.contact,
        dateOfBirth: req.body.dateOfBirth,
        educationQualification: req.body.educationQualification,
        enrollment: req.body.enrollment,
        image: req.body.image,
        notes: req.body.notes,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const idParam = req.params.id as string;

      // Legacy frontend passes email as the :id param (e.g. GET /api/v1/students/user@example.com)
      // Admin users won't have a student record — return null instead of 404.
      if (idParam.includes('@')) {
        try {
          const useCase = new FindStudentByEmail(studentRepo);
          const result = await useCase.execute({ tenantId, email: idParam });
          res.json({ success: true, data: result });
        } catch {
          res.json({ success: true, data: null });
        }
        return;
      }

      const useCase = new GetStudent(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: idParam,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListStudents(studentRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as StudentStatus | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateStudent(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.id as string,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        fatherName: req.body.fatherName,
        contact: req.body.contact,
        dateOfBirth: req.body.dateOfBirth,
        educationQualification: req.body.educationQualification,
        enrollment: req.body.enrollment,
        status: req.body.status,
        image: req.body.image,
        notes: req.body.notes,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async dropout(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DropOutStudent(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.id as string,
        message: req.body?.message,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteStudent(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async search(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListStudents(studentRepo);
      const result = await useCase.execute({
        tenantId,
        search: req.query.q as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async renew(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new RenewStudent(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.id as string,
        extraFees: req.body.extraFees,
        noOfInstallments: req.body.noOfInstallments,
        duration: req.body.duration,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createAlert(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new CreateStudentAlert(alertRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        date: req.body.date,
        reminderDateTime: req.body.reminderDateTime,
        status: req.body.status,
        particulars: req.body.particulars,
        createdBy: userId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listAlerts(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListStudentAlerts(alertRepo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateAlert(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateStudentAlert(alertRepo);
      const result = await useCase.execute({
        tenantId,
        alertId: req.params.id as string,
        date: req.body.date,
        reminderDateTime: req.body.reminderDateTime,
        status: req.body.status,
        particulars: req.body.particulars,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteAlert(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteStudentAlert(alertRepo);
      const result = await useCase.execute({
        tenantId,
        alertId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getByEmail(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new FindStudentByEmail(studentRepo);
      const result = await useCase.execute({
        tenantId,
        email: req.params.email as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listByCompany(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListStudentsByCompany(studentRepo);
      const result = await useCase.execute({
        tenantId,
        companyId: req.params.companyId as string,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as StudentStatus | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listByCompanyCourse(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListStudentsByCompanyCourse(studentRepo);
      const result = await useCase.execute({
        tenantId,
        companyId: req.params.companyId as string,
        courseId: req.params.courseId as string,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as StudentStatus | undefined,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listForFeesCollection(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListStudentsForFeesCollection(studentRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async sendWarningMail(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SendWarningMail(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.id as string,
        templateData: req.body?.templateData,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async sendCancellationMail(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SendCancellationMail(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.id as string,
        templateData: req.body?.templateData,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async sendReceiptMail(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const body = req.body as any;
      const rawId = req.params.id as string;

      // Query raw students collection — handles both legacy {name,email} and DDD {firstName,lastName,contact.email}
      const { default: mongoose } = await import('mongoose');
      const db = mongoose.connection.db!;
      const isOid = /^[a-f\d]{24}$/i.test(rawId);
      const oid = isOid ? new mongoose.Types.ObjectId(rawId) : null;
      const filter = oid
        ? { tenantId, $or: [{ _id: oid }, { _legacyId: rawId }] }
        : { tenantId, _legacyId: rawId };
      const studentDoc = await db.collection('students').findOne(filter, {
        projection: { name: 1, firstName: 1, lastName: 1, email: 1, contact: 1 },
      }) as any;

      if (!studentDoc) {
        return next(new (await import('../../../shared/domain/errors.js')).NotFoundError('Student', rawId));
      }

      const studentName =
        studentDoc.name ||
        [studentDoc.firstName, studentDoc.lastName].filter(Boolean).join(' ') ||
        'Student';
      const email: string | undefined =
        studentDoc.contact?.email || studentDoc.email;

      if (!email) {
        res.json({ success: true, message: 'Receipt mail skipped — no email on file', studentId: rawId });
        return;
      }

      const paymentId = body.paymentId ?? body.reciptNumber ?? body._id ?? 'N/A';
      const amount = body.paymentDetails?.amount ?? body.amountPaid ?? 'N/A';

      // Resolve sender name from the logged-in user
      let sentBy = 'Admin';
      const userId = req.user?.userId;
      if (userId) {
        try {
          const { ObjectId } = await import('mongodb');
          const isOidUser = /^[a-f\d]{24}$/i.test(userId);
          const userFilter = isOidUser
            ? { $or: [{ _id: new ObjectId(userId) }, { _legacyId: userId }] }
            : { _legacyId: userId };
          const userDoc = await db.collection('users').findOne(
            userFilter,
            { projection: { firstName: 1, lastName: 1, fName: 1, lName: 1, name: 1 } },
          ) as any;
          if (userDoc) {
            sentBy =
              userDoc.name ||
              [userDoc.firstName || userDoc.fName, userDoc.lastName || userDoc.lName]
                .filter(Boolean).join(' ') ||
              'Admin';
          }
        } catch { /* keep default */ }
      }

      // Collect SuperAdmin emails for this tenant
      const superAdminEmails: string[] = [];
      try {
        const admins = await db.collection('users')
          .find(
            { tenantId, role: 'SuperAdmin', isActive: { $ne: false } },
            { projection: { email: 1 } },
          ).toArray() as any[];
        for (const a of admins) {
          if (a.email && a.email !== email) superAdminEmails.push(a.email);
        }
      } catch { /* ignore */ }

      const recipients = [email, ...superAdminEmails];

      const { EmailService } = await import('../../../shared/infrastructure/email/EmailService.js');
      try {
        await new EmailService().send({
          to: recipients,
          tenantId,
          sentBy,
          subject: 'Payment Receipt - Flex Academy',
          html: `<p>Dear ${studentName},</p>
<p>Your payment has been received successfully.</p>
<p><strong>Payment ID:</strong> ${paymentId}<br/>
<strong>Amount:</strong> ${amount}</p>
<p>Thank you for your payment.</p>
<p>Regards,<br/>Flex Academy</p>`,
        });
      } catch (_emailErr) {
        // log but don't fail the response
      }

      res.json({ success: true, message: 'Receipt mail processed successfully', studentId: rawId, email });
    } catch (err) {
      next(err);
    }
  }

  async sendBulkMail(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SendBulkMail(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentIds: req.body.studentIds,
        subject: req.body.subject,
        content: req.body.content,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async uploadPhoto(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const filePath = (req as any).uploadedFilePath;
      if (!filePath) return next(new ValidationError('No photo file uploaded'));

      const useCase = new UploadStudentPhoto(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.id as string,
        filePath,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async sendCourseChangeMail(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SendCourseChangeMail(studentRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.id as string,
        newCourseId: req.body.newCourseId,
        newCourseName: req.body.newCourseName,
        additionalDetails: req.body.additionalDetails,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
