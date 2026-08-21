import { CreatePaymentTicketRequest, VerifyPaymentTicketRequest } from './gateway.req';
import { CreatePaymentTicketResponse, VerifyPaymentTicketResponse } from './gateway.res';

export interface PaymentGateway {
  name: string;
  supportsPartialPayment: boolean;

  createPaymentTicket(req: CreatePaymentTicketRequest): Promise<CreatePaymentTicketResponse>;

  verifyPaymentTicket(req: VerifyPaymentTicketRequest): Promise<VerifyPaymentTicketResponse>;

  removeTicket(req: { ticketId: string }): Promise<void>;
}
