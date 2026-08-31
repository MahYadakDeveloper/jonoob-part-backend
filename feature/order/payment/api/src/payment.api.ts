import { PaymentSessionCreationRequest, RefundRequest, SettleRequest } from './payment.requests';
import { RefundResponse, SettleResponse } from './payment.responses';
import { Payment, PaymentMethod } from './payment.types';

export interface PaymentApi {
  createPaymentSession(
    req: PaymentSessionCreationRequest,
  ): Promise<{ payment: Extract<Payment, { status: 'initiated' }> }>;

  settle<T extends PaymentMethod>(req: SettleRequest<T>): Promise<SettleResponse>;

  refund(req: RefundRequest): Promise<RefundResponse>;
}
