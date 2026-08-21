import { TicketStatus } from './gateway.res';

export const TicketVerifiedEventType = 'gateway:ticket-verified-event';
export const TicketVerificationFailedEventType = 'gateway:ticket-verification-failed-event';

export type TicketVerifiedEventPayload = {
  gateway: string;
  ticketId: string;
  providerId: number;
};

export type TicketVerificationFailedEventPayload = {
  gateway: string;
  ticketId: string;
  providerId: number;
  status: TicketStatus;
};
