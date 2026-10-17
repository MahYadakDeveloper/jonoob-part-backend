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

  createPaymentTicket(
    request: CreatePaymentTicket,
  ): Promise<{ paymentUrl: string; ticketId: string }>;

  verifyPaymentTicket(
    providerId: number,
    ticketId: string,
  ): Promise<TicketStatus>;

  refundPaymentTicket(ticketId: string, providerId: number): Promise<void>;
}

export type CreatePaymentTicket = {
  providerId: number; // payment id
  customer: {
    phone: string;
  };
  merchandise: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];

  amount: number;
};

export type TicketStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'verified-before'
  | 'canceled'
  | 'expired'
  | 'reversed';
