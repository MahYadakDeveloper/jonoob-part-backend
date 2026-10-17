import { MerchandiseLine } from '@feature/shared/types/merchandise-line';

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
    req: CreatePaymentTicketRequest,
  ): Promise<CreatePaymentTicketResponse>;

  verifyPaymentTicket(
    req: VerifyPaymentTicketRequest,
  ): Promise<VerifyPaymentTicketResponse>;

  getTicketStatus(
    req: GetTicketStatusRequest,
  ): Promise<GetTicketStatusResponse>;

  refundPaymentTicket(req: {
    ticketId: string;
    providerId: number;
  }): Promise<{ result: 'refunded' | 'failed' }>;
}

export type CreatePaymentTicketResponse = {
  paymentUrl: string;
  ticketId: string;
};
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

export type CreatePaymentTicketRequest = {
  providerId: number; // payment session id
  customerContact: {
    phoneNumber: string;
  };
  merchandises: MerchandiseLine[];
  amount: number;
};

export type VerifyPaymentTicketRequest = {
  providerId: number;
  ticketId: string;
};

export type GetPaymentTicketIdRequest = {
  providerId: number;
};
export interface GetTicketStatusRequest {
  ticketId: string;
}
