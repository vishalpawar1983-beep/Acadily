import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFeeInstallmentRepository } from '../domain/repositories/IFeeInstallmentRepository.js';
import type { IStudentRepository } from '../../student/domain/repositories/IStudentRepository.js';

export interface ListInstallmentsByCompanyRequest {
  tenantId: string;
  companyId: string;
  skip?: number;
  limit?: number;
}

export interface ListInstallmentsByCompanyResponse {
  installments: Array<{
    id: string;
    studentId: string;
    courseId: string;
    installmentNumber: number;
    installmentAmount: number;
    dueDate: Date;
    paidDate: Date | null;
    isPaid: boolean;
    isDropout: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
}

export class ListInstallmentsByCompany implements UseCase<ListInstallmentsByCompanyRequest, ListInstallmentsByCompanyResponse> {
  constructor(
    private readonly installmentRepo: IFeeInstallmentRepository,
    private readonly studentRepo: IStudentRepository,
  ) {}

  async execute(request: ListInstallmentsByCompanyRequest): Promise<ListInstallmentsByCompanyResponse> {
    // First find all students belonging to the company
    const { students } = await this.studentRepo.findByCompany(request.tenantId, request.companyId, {
      limit: 10000,
    });

    const studentIds = students.map((s) => s.id);

    if (studentIds.length === 0) {
      return { installments: [], total: 0 };
    }

    // Fetch installments for all students in the company
    const allInstallments = await Promise.all(
      studentIds.map((studentId) => this.installmentRepo.findByStudent(request.tenantId, studentId)),
    );

    const flatInstallments = allInstallments.flat();
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;
    const paged = flatInstallments.slice(skip, skip + limit);

    return {
      installments: paged.map((i) => ({
        id: i.id,
        studentId: i.studentId,
        courseId: i.courseId,
        installmentNumber: i.installmentNumber,
        installmentAmount: i.installmentAmount,
        dueDate: i.dueDate,
        paidDate: i.paidDate,
        isPaid: i.isPaid,
        isDropout: i.isDropout,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
      total: flatInstallments.length,
    };
  }
}
