import {
  CreatePaymentTicketRequest,
  GetTicketStatusRequest,
  VerifyPaymentTicketRequest,
} from './gateway.req';
import {
  CreatePaymentTicketResponse,
  GetTicketStatusResponse,
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

  createPaymentTicket(req: CreatePaymentTicketRequest): Promise<CreatePaymentTicketResponse>;

  verifyPaymentTicket(req: VerifyPaymentTicketRequest): Promise<VerifyPaymentTicketResponse>;

  getTicketStatus(req: GetTicketStatusRequest): Promise<GetTicketStatusResponse>;

  refundPaymentTicket(req: {
    ticketId: string;
    providerId: number;
  }): Promise<{ result: 'refunded' | 'failed' }>;
}
