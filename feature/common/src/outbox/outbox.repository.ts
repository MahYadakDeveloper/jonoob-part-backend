import { NewOutboxEvent, OutboxEvent } from "./outbox-event";

export interface IOutboxRepository {
  save(event: NewOutboxEvent): Promise<void>;
  saveMany(events: NewOutboxEvent[]): Promise<void>;
  findPending(limit: number): Promise<OutboxEvent[]>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
