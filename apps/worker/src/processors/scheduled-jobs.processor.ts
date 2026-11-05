import {
  JobHandler,
  SCHEDULED_QUEUE,
  scheduledJobName,
  ScheduledJobData,
} from '@infra/messaging-job-scheduler/contracts';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { Job } from 'bullmq';

@Processor(SCHEDULED_QUEUE)
export class ScheduledJobsProcessor extends WorkerHost implements OnModuleInit {
  private readonly handlers = new Map<string, JobHandler>();

  constructor(private readonly discovery: DiscoveryService) {
    super();
  }

  onModuleInit() {
    for (const { instance, metatype } of this.discovery.getProviders()) {
      const name = metatype && scheduledJobName(metatype);
      if (!name || !instance) continue;
      if (this.handlers.has(name))
        throw new Error(`Duplicate scheduled job name: ${name}`);
      this.handlers.set(name, instance);
    }
  }

  async process(job: Job<ScheduledJobData>): Promise<void> {
    const handler = this.handlers.get(job.name);
    if (!handler) throw new Error(`No handler for scheduled job "${job.name}"`);
    await handler.handle(job.data.payload);
  }
}
