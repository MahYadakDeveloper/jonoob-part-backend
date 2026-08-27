import {
  CreatePaymentTicketRequest,
  GetPaymentTicketIdRequest,
  VerifyPaymentTicketRequest,
} from './gateway.req';
import {
  CreatePaymentTicketResponse,
  GetPaymentTicketIdResponse,
  VerifyPaymentTicketResponse,
} from './gateway.res';

export interface PaymentGateway {
  key: string;
  supportsPartialPayment: boolean;

  expiryInMinutes: number;
  /**
   * This member hold timeout in min if the system not verify and cash would be refund
   * possible scenarios:
   *  - fail to redirect after successful payment
   */
  verificationDeadlineInMinutes: number;

  getPaymentTicketId(req: GetPaymentTicketIdRequest): Promise<GetPaymentTicketIdResponse>;

  createPaymentTicket(req: CreatePaymentTicketRequest): Promise<CreatePaymentTicketResponse>;

  verifyPaymentTicket(req: VerifyPaymentTicketRequest): Promise<VerifyPaymentTicketResponse>;

  refundPaymentTicket(req: { ticketId: string; providerId: number }): Promise<void>;

  removeTicket(req: { ticketId: string }): Promise<void>;
}
