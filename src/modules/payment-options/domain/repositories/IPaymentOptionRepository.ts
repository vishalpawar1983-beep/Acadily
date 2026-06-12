import { PaymentOption } from '../entities/PaymentOption.js';

export interface FindAllPaymentOptionsOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface IPaymentOptionRepository {
  findById(tenantId: string, id: string): Promise<PaymentOption | null>;
  findByName(tenantId: string, name: string): Promise<PaymentOption | null>;
  findAll(
    tenantId: string,
    options?: FindAllPaymentOptionsOptions,
  ): Promise<{ paymentOptions: PaymentOption[]; total: number }>;
  save(paymentOption: PaymentOption): Promise<PaymentOption>;
  update(paymentOption: PaymentOption): Promise<PaymentOption>;
  delete(tenantId: string, id: string): Promise<void>;
}
