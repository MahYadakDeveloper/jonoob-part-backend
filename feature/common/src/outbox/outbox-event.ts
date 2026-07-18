export type OutboxEvent = {
  id: string;

  type: string;

  payload: unknown;

  occurredAt: Date;
}

export type NewOutboxEvent = Omit<OutboxEvent, "id" | "occurredAt">
