import {
  IOutboxRepository,
  NewOutboxEvent,
  OutboxEvent,
} from "@feature/common";
import { Injectable } from "@nestjs/common";
import { type OutboxDatasource } from "./outbox-datasource";

@Injectable()
export class OutboxRepository implements IOutboxRepository {
  constructor(private readonly datasource: OutboxDatasource) {}

  async save(event: NewOutboxEvent): Promise<void> {
    await this.datasource.create({
      ...event,
      occurredAt: new Date(),
    });
  }

  async saveMany(events: NewOutboxEvent[]): Promise<void> {
    await this.datasource.createMany(
      events.map((event) => ({
        ...event,
        occurredAt: new Date(),
      })),
    );
  }

  async findPending(limit: number): Promise<OutboxEvent[]> {
    return this.datasource.findMany({
      where: {
        publishedAt: null,
      },
      orderBy: {
        occurredAt: "asc",
      },
      take: limit,
    });
  }

  async delete(id: string): Promise<void> {
    await this.datasource.delete(id);
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.datasource.deleteMany(ids);
  }
}
