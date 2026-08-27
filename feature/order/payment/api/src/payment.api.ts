import {
  GetPaymentGatewayByOrderIdRequest,
  PaymentSessionCreationRequest,
  RefundRequest,
} from './payment.requests';
import {
  GetPaymentGatewayByOrderIdResponse,
  PaymentSessionCreationResponse,
  RefundResponse,
} from './payment.responses';

export interface PaymentApi {
  createPaymentSession(req: PaymentSessionCreationRequest): Promise<PaymentSessionCreationResponse>;
  getPaymentGatewayByOrderId(
    req: GetPaymentGatewayByOrderIdRequest,
  ): Promise<GetPaymentGatewayByOrderIdResponse>;
  getTrackingCode(req: { sessionId: number }): Promise<{ trackingCode: string }>;
  refund(req: RefundRequest): Promise<RefundResponse>;
}
