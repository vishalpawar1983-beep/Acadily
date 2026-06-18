import { Student } from '../domain/entities/Student.js';
import type { StudentStatus } from '../domain/entities/Student.js';
import type { IStudentRepository, FindAllOptions } from '../domain/repositories/IStudentRepository.js';
import { StudentModel, type IStudentDocument } from './StudentModel.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export class MongoStudentRepository implements IStudentRepository {
  async findById(tenantId: string, id: string): Promise<Student | null> {
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { _legacyId: id }], tenantId }
      : { _legacyId: id, tenantId };
    const doc = await StudentModel.findOne(query as any).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByRollNumber(tenantId: string, rollNumber: string): Promise<Student | null> {
    const doc = await StudentModel.findOne({ tenantId, rollNumber }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(tenantId: string, email: string): Promise<Student | null> {
    const doc = await StudentModel.findOne({ tenantId, 'contact.email': email }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByCompany(
    tenantId: string,
    companyId: string,
    options: FindAllOptions = {},
  ): Promise<{ students: Student[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId, deleted: { $ne: true }, 'enrollment.companyId': companyId };
    if (options.status) filter.status = options.status;
    if (options.search) {
      filter.$or = [
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
        { rollNumber: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      StudentModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      StudentModel.countDocuments(filter).exec(),
    ]);

    return {
      students: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async findByCompanyAndCourse(
    tenantId: string,
    companyId: string,
    courseId: string,
    options: FindAllOptions = {},
  ): Promise<{ students: Student[]; total: number }> {
    const filter: Record<string, unknown> = {
      tenantId,
      deleted: { $ne: true },
      'enrollment.companyId': companyId,
      'enrollment.courseId': courseId,
    };
    if (options.status) filter.status = options.status;
    if (options.search) {
      filter.$or = [
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
        { rollNumber: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      StudentModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      StudentModel.countDocuments(filter).exec(),
    ]);

    return {
      students: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async findAll(
    tenantId: string,
    options: FindAllOptions = {},
  ): Promise<{ students: Student[]; total: number }> {
    const filter: Record<string, unknown> = { tenantId, deleted: { $ne: true } };
    if (options.status) filter.status = options.status;
    if (options.search) {
      filter.$or = [
        { firstName: { $regex: options.search, $options: 'i' } },
        { lastName: { $regex: options.search, $options: 'i' } },
        { rollNumber: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      StudentModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ createdAt: -1 })
        .exec(),
      StudentModel.countDocuments(filter).exec(),
    ]);

    return {
      students: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(student: Student): Promise<Student> {
    const doc = await StudentModel.create({
      _id: student.id,
      tenantId: student.tenantId,
      rollNumber: student.rollNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      fatherName: student.fatherName,
      contact: student.contact,
      dateOfBirth: student.dateOfBirth,
      educationQualification: student.educationQualification,
      enrollment: student.enrollment,
      status: student.status,
      image: student.image,
      notes: student.notes,
    });
    return this.toDomain(doc);
  }

  async update(student: Student): Promise<Student> {
    const doc = await StudentModel.findOneAndUpdate(
      { _id: student.id, tenantId: student.tenantId },
      {
        rollNumber: student.rollNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        fatherName: student.fatherName,
        contact: student.contact,
        dateOfBirth: student.dateOfBirth,
        educationQualification: student.educationQualification,
        enrollment: student.enrollment,
        status: student.status,
        image: student.image,
        notes: student.notes,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Student', student.id);
    return this.toDomain(doc);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    // Soft-delete: mark the student deleted (recoverable) instead of removing the
    // document. The frontend may pass either the _id or the legacy id, so resolve
    // both (mirrors findById). All list/count queries here filter out `deleted`.
    const or: Record<string, unknown>[] = [{ _legacyId: id }];
    if (/^[a-f\d]{24}$/i.test(id)) or.push({ _id: id });
    await StudentModel.updateOne(
      { tenantId, $or: or },
      { $set: { deleted: true, deletedAt: new Date() } },
    ).exec();
  }

  async findUnpaidStudents(
    tenantId: string,
    options: { fromDate?: Date; toDate?: Date } = {},
  ): Promise<Student[]> {
    const filter: Record<string, unknown> = {
      tenantId,
      deleted: { $ne: true },
      status: { $ne: 'dropout' },
      'enrollment.remainingFees': { $gt: 0 },
    };
    if (options.fromDate || options.toDate) {
      const dateFilter: Record<string, Date> = {};
      if (options.fromDate) dateFilter.$gte = options.fromDate;
      if (options.toDate) dateFilter.$lte = options.toDate;
      filter['enrollment.dateOfJoining'] = dateFilter;
    }
    const docs = await StudentModel.find(filter).sort({ createdAt: -1 }).limit(1000).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async count(tenantId: string, filter?: { status?: StudentStatus }): Promise<number> {
    const query: Record<string, unknown> = { tenantId, deleted: { $ne: true } };
    if (filter?.status) query.status = filter.status;
    return StudentModel.countDocuments(query).exec();
  }

  private toDomain(doc: IStudentDocument): Student {
    return Student.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      rollNumber: doc.rollNumber,
      firstName: doc.firstName,
      lastName: doc.lastName,
      fatherName: doc.fatherName,
      contact: {
        mobile: doc.contact.mobile,
        phone: doc.contact.phone,
        email: doc.contact.email,
        address: doc.contact.address,
        city: doc.contact.city,
      },
      dateOfBirth: doc.dateOfBirth,
      educationQualification: doc.educationQualification,
      enrollment: {
        courseId: doc.enrollment.courseId,
        courseName: doc.enrollment.courseName,
        courseFees: doc.enrollment.courseFees,
        discount: doc.enrollment.discount,
        netFees: doc.enrollment.netFees,
        remainingFees: doc.enrollment.remainingFees,
        totalPaid: doc.enrollment.totalPaid,
        downPayment: doc.enrollment.downPayment,
        dateOfJoining: doc.enrollment.dateOfJoining,
        installmentCount: doc.enrollment.installmentCount,
        installmentAmount: doc.enrollment.installmentAmount,
        companyId: doc.enrollment.companyId,
        companyName: doc.enrollment.companyName,
      },
      status: doc.status as StudentStatus,
      image: doc.image,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
