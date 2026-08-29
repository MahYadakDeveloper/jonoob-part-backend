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
import { PaymentMethod } from './payment.types';

export interface PaymentApi {
  pay<T extends PaymentMethod>(
    req: PaymentSessionCreationRequest<T>,
  ): Promise<PaymentSessionCreationResponse<T>>;
  getPaymentGatewayByOrderId(
    req: GetPaymentGatewayByOrderIdRequest,
  ): Promise<GetPaymentGatewayByOrderIdResponse>;
  getTrackingCode(req: { sessionId: number }): Promise<{ trackingCode: string }>;
  refund(req: RefundRequest): Promise<RefundResponse>;
}
