export interface OutboxEvent {
  id: string;

  type: string;

  payload: unknown;

  occurredAt: Date;
}
