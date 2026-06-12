import { describe, it, expect } from '@jest/globals';
import { FeePayment } from '../../../src/modules/fees/domain/entities/FeePayment';

const validInput = {
  tenantId: 'tenant_1',
  studentId: 'stu-1',
  courseId: 'crs-1',
  netCourseFees: 45000,
  remainingFees: 35000,
  amountPaid: 10000,
  receiptNumber: 'RCT-001',
  paymentMethod: 'cash',
  gstPercentage: 18,
  addedBy: 'user-1',
};

describe('FeePayment entity', () => {
  it('should create with defaults', () => {
    const fee = FeePayment.create(validInput);
    expect(fee.studentId).toBe('stu-1');
    expect(fee.amountPaid).toBe(10000);
    expect(fee.lateFees).toBe(0);
    expect(fee.paymentDate).toBeDefined();
    expect(fee.id).toBeDefined();
  });

  it('should create with optional fields', () => {
    const fee = FeePayment.create({
      ...validInput,
      lateFees: 500,
      narration: 'First installment',
      paymentDate: new Date('2026-02-01'),
    });
    expect(fee.lateFees).toBe(500);
    expect(fee.narration).toBe('First installment');
    expect(fee.paymentDate).toEqual(new Date('2026-02-01'));
  });

  it('should expose all financial fields', () => {
    const fee = FeePayment.create(validInput);
    expect(fee.netCourseFees).toBe(45000);
    expect(fee.remainingFees).toBe(35000);
    expect(fee.gstPercentage).toBe(18);
    expect(fee.receiptNumber).toBe('RCT-001');
    expect(fee.paymentMethod).toBe('cash');
  });

  it('should reconstitute from persisted data', () => {
    const now = new Date();
    const fee = FeePayment.reconstitute('fee-123', {
      ...validInput,
      lateFees: 0,
      paymentDate: now,
      createdAt: now,
      updatedAt: now,
    });
    expect(fee.id).toBe('fee-123');
    expect(fee.tenantId).toBe('tenant_1');
  });
});
