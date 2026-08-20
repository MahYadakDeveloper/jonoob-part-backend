import {
  GetPaymentGatewayByOrderIdRequest,
  PaymentSessionCreationRequest,
  PayRequest,
  PlanPaymentRequest,
} from './payment.requests';
import {
  GetPaymentGatewayByOrderIdResponse,
  PayResponse,
  PlanPaymentResponse,
} from './payment.responses';

export interface PaymentApi {
  planPayment(req: PlanPaymentRequest): Promise<PlanPaymentResponse>;
  createPaymentSession(req: PaymentSessionCreationRequest): Promise<void>;
  pay(req: PayRequest): Promise<PayResponse>;
  getPaymentGatewayByOrderId(
    req: GetPaymentGatewayByOrderIdRequest,
  ): Promise<GetPaymentGatewayByOrderIdResponse>;
  getTrackingCode(req: { providerId: number }): Promise<{ trackingCode: string }>;
}
