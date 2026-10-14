import { TicketStatus } from './gateway.res';

export const TicketVerifiedEventType = 'gateway:ticket-verified-event';
export const TicketVerificationFailedEventType = 'gateway:ticket-verification-failed-event';

export type TicketVerifiedEventPayload = {
  providerId: number;
};

export type TicketVerificationFailedEventPayload = {
  providerId: number;
  status: TicketStatus;
};
