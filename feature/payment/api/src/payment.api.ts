import { PlanPaymentRequest } from "./payment.requests";
import { PlanPaymentResponse } from "./payment.responses";

export interface IPaymentService {
  planPayment(req: PlanPaymentRequest): Promise<PlanPaymentResponse>;

  /**
   * Note:
   *  This API may be moved to the Wallet feature in the future, as it is not
   * strictly payment-specific. Keep its design flexible until the ownership
   * is finalized.
   */
  sendWalletVerificationCode(): Promise<void>;
}
