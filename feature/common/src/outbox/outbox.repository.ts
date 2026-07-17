import { OutboxEvent } from "./outbox-event";

export interface IOutboxRepository {
  save(event: Omit<OutboxEvent, "id" | "occurredAt">): Promise<void>;
  saveMany(event: Omit<OutboxEvent, "id" | "occurredAt">): Promise<void>;
  findPending(limit: number): Promise<OutboxEvent[]>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}
