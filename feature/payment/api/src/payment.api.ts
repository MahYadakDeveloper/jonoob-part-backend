import {
  GetPaymentGatewayByOrderIdRequest,
  PaymentSessionCreationRequest,
  PlanPaymentRequest,
} from './payment.requests';
import { GetPaymentGatewayByOrderIdResponse, PlanPaymentResponse } from './payment.responses';

export interface PaymentApi {
  planPayment(req: PlanPaymentRequest): Promise<PlanPaymentResponse>;
  createPaymentSession(req: PaymentSessionCreationRequest): Promise<{ paymentSessionId: number }>;
  getPaymentGatewayByOrderId(
    req: GetPaymentGatewayByOrderIdRequest,
  ): Promise<GetPaymentGatewayByOrderIdResponse>;
  getTrackingCode(req: { providerId: number }): Promise<{ trackingCode: string }>;
  refund({
    paymentSessionId,
  }: {
    paymentSessionId: number;
  }): Promise<{ refundedTo: 'wallet' | 'payment_reversed' }>;
}
