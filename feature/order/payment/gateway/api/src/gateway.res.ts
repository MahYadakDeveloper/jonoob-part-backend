export type CreatePaymentTicketResponse = { paymentUrl: string; ticketId: string };
export type VerifyPaymentTicketResponse = {
  status: TicketStatus;
};

export type GetPaymentTicketIdResponse = {
  ticketId: string;
};

export interface GetTicketStatusResponse {
  status: TicketStatus;
}

export type TicketStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'verified-before'
  | 'canceled'
  | 'expired'
  | 'reversed';
