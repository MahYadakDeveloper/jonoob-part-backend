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

  readonly name: string = 'digipay' as const;
  createPaymentTicket(
    request: CreatePaymentTicket,
  ): Promise<{ paymentUrl: string; ticketId: string }> {
    throw new Error('Method not implemented.');
  }
  verifyPaymentTicket(
    paymentId: number,
    ticketId: string,
  ): Promise<TicketStatus> {
    throw new Error('Method not implemented.');
  }
  refundPaymentTicket(paymentId: number, ticketId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
