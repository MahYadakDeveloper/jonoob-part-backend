import { FindOutboxEventsParams, NewOutboxEventPersistence, OutboxEventPersistence } from "./types";

export interface OutboxDatasource {
  create(
    data: NewOutboxEventPersistence,
  ): Promise<void>;

  createMany(
    data: NewOutboxEventPersistence[],
  ): Promise<void>;

  findMany(
    params: FindOutboxEventsParams,
  ): Promise<OutboxEventPersistence[]>;

  delete(
    id: string,
  ): Promise<void>;

  deleteMany(
    ids: string[],
  ): Promise<void>;
}