import { CreatePaymentTicketRequest, VerifyPaymentTicketRequest } from './gateway.req';
import { CreatePaymentTicketResponse, VerifyPaymentTicketResponse } from './gateway.res';

export interface PaymentGateway {
  name: string;
  supportsPartialPayment: boolean;

  /**
   * Generate Token / Auth
   *
   * [NOTE]
   *  Based on the token generated then generate link from its api
   * mentioned from provider documentation for example return url
   * link
   */
  createPaymentTicket(req: CreatePaymentTicketRequest): Promise<CreatePaymentTicketResponse>;

  verifyPaymentTicket(req: VerifyPaymentTicketRequest): Promise<VerifyPaymentTicketResponse>;
}
