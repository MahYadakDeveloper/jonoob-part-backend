import { PaymentSessionCreationRequest, RefundRequest, SettleRequest } from './payment.requests';
import { RefundResponse, SettleResponse } from './payment.responses';
import { PaymentMethod } from './payment.types';

export interface PaymentApi {
  createPaymentSession(req: PaymentSessionCreationRequest): Promise<{ sessionId: number }>;

  settle<T extends PaymentMethod>(req: SettleRequest<T>): Promise<SettleResponse>;

  refund(req: RefundRequest): Promise<void>;
}
