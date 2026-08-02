import { type EventHandlerRegistry } from '@feature/common';
import { OnQueueEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UnknownEventHandlerError } from './unknown-event-handler.error';

@Processor('events')
export class EventsConsumer extends WorkerHost {
  constructor(private readonly registry: EventHandlerRegistry) {
    super();
  }

  async process(job: Job) {
    const handlers = this.registry.get(job.name);

    if (!handlers.length) {
      throw new UnknownEventHandlerError(job.name);
    }

    await Promise.all(handlers.map((handler) => handler.handle(job.data)));
  }

  @OnQueueEvent('failed')
  onFailed() {
    // TODO Handle the failure of jobs
  }
}
