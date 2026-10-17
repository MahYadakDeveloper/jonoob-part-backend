import {
  CreatePaymentTicket,
  PaymentGateway,
  TicketStatus,
} from '../contracts';

export class DigipayGateway implements PaymentGateway {
  key: string;
  supportsPartialPayment: boolean;
  expiryInMinutes: number;
  verificationDeadlineInMinutes: number;
  createPaymentTicket(
    request: CreatePaymentTicket,
  ): Promise<{ paymentUrl: string; ticketId: string }> {
    throw new Error('Method not implemented.');
  }
  verifyPaymentTicket(
    providerId: number,
    ticketId: string,
  ): Promise<TicketStatus> {
    throw new Error('Method not implemented.');
  }
  refundPaymentTicket(ticketId: string, providerId: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  readonly name: string = 'digipay' as const;
}
