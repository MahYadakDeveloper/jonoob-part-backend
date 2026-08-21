export type CreateTicketRequest = {
  amount: number;
  redirect_uri: string;
  fallback_uri: string;
  provider_id: number;
  mobile_number: string;
  merchant_id: string;
  items: {
    name: string;
    count: number;
    amount: number;
    url: string;
  }[];
};

export type CreateTicketResponse = {
  rsCode: any;
  result: {
    payment_uri: string;
    ticket_id: string;
  };
};

export type VerifyTicketRequest = {
  ticket_id: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type AuthRequest = {
  username: string;
  password: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken?: string;
};

/**
 * 1 (Created)
 * 2 (Verified)
 * 3 (Reversed)
 * 4 (Failed)
 * 5 (Canceled)
 * 6 (Settled)
 * 7 (Expired)
 * 8 (Done)
 */
export type VerifyTicketResponse = {
  rsCode: any;
  result: { rsCode: any; ticket_id: string; status: number };
};

// 1 (Created)
// 2 (Verified)
// 3 (Reversed)
// 4 (Failed)
// 5 (Canceled)
// 6 (Settled)
// 7 (Expired)
// 8 (Done)
// 9 (Settle Queue)
export const TicketStatus = {
  1: 'created',
  2: 'verified',
  3: 'reversed',
  4: 'failed',
  5: 'canceled',
  6: 'settled',
  7: 'expired',
  8: 'done',
  9: 'settleQueued',
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export type TicketStatusRequest = {
  ticket_id: string;
};

export type TicketStatusResponse = {
  rsCode: any;
  result: {
    rsCode: any;
    status: number;
  };
};
