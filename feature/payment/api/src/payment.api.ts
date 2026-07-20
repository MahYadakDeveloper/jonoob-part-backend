import { PlanPaymentRequest } from "./payment.requests";
import { PlanPaymentResponse } from "./payment.responses";

export interface PaymentApi {
  planPayment(req: PlanPaymentRequest): Promise<PlanPaymentResponse>;
}
