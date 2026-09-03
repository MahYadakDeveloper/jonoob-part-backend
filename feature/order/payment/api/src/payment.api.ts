import { PaymentSessionCreationRequest, RefundRequest, SettleRequest } from './payment.requests';
import { SettleResponse } from './payment.responses';
import { PaymentMethod } from './payment.types';

export interface PaymentApi {
  initialize(req: PaymentSessionCreationRequest): Promise<void>;

  settle<T extends PaymentMethod>(req: SettleRequest<T>): Promise<SettleResponse>;

  refund(req: RefundRequest): Promise<void>;
}
