import { PaymentSessionCreationRequest, PayRequest, PlanPaymentRequest } from './payment.requests';
import { PayResponse, PlanPaymentResponse } from './payment.responses';

export interface PaymentApi {
  planPayment(req: PlanPaymentRequest): Promise<PlanPaymentResponse>;
  createPaymentSession(req: PaymentSessionCreationRequest): Promise<void>;
  pay(req: PayRequest): Promise<PayResponse>;
}
