import { OnQueueEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { UnknownEventHandlerError } from "./unknown-event-handler.error";
import { type EventHandlerRegistry } from "@feature/common";

@Processor("events")
export class EventsConsumer extends WorkerHost {
  constructor(private readonly registry: EventHandlerRegistry) {
    super();
  }

  async process(job: Job) {
    const handler = this.registry.get(job.name);

    if (!handler) {
      throw new UnknownEventHandlerError(job.name);
    }

    await handler.handle(job.data);
  }

  @OnQueueEvent("failed")
  onFailed() {
    // TODO Handle the failure of jobs
  }
}
