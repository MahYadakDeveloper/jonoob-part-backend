export type CreatePaymentTicketResponse = { paymentUri: string };
export type VerifyPaymentTicketResponse = {
  status: TicketStatus;
};

export type TicketStatus = 'verified' | 'failure' | 'verified-before' | 'canceled' | 'expired';
