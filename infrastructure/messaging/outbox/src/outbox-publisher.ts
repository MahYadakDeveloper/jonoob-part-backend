import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { type IOutboxRepository } from "@feature/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class OutboxPublisher {
  constructor(
    @InjectQueue("events")
    private readonly queue: Queue,
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  @Cron("*/5 * * * * *")
  async publishPendingEvents() {
    const events = await this.outboxRepository.findPending(100);

    const publishedIds: string[] = [];

    for (const event of events) {
      await this.queue.add(event.type, event.payload, {
        jobId: event.id,
      });

      publishedIds.push(event.id);
    }

    await this.outboxRepository.deleteMany(publishedIds);
  }
}
