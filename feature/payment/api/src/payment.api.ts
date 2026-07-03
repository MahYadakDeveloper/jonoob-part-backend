import { PlanPaymentRequest } from "./payment.requests";
import { PlanPaymentResponse } from "./payment.responses";

export interface IPaymentService {
  planPayment(req: PlanPaymentRequest): Promise<PlanPaymentResponse>;
}
