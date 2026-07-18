export type NewOutboxEventPersistence = {
  type: string;
  payload: unknown;
  occurredAt: Date;
};

export type OutboxEventPersistence = {
  id: string;
  type: string;
  payload: unknown;
  occurredAt: Date;
  publishedAt: Date | null;
};

export type FindOutboxEventsParams = {
  where?: {
    publishedAt?: Date | null;
  };

  orderBy?: {
    occurredAt: "asc" | "desc";
  };

  take?: number;
};
