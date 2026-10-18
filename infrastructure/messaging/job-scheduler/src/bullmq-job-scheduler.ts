import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Type } from '@nestjs/common';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  JobHandler,
  jobName,
  ScheduleArgs,
  SCHEDULED_QUEUE,
  ScheduledJobData,
} from './contracts';

@Injectable()
export class BullmqJobScheduler {
  constructor(
    @InjectQueue(SCHEDULED_QUEUE)
    private readonly queue: Queue<ScheduledJobData>,
  ) {}

  async schedule<H extends JobHandler>(
    job: Type<H>,
    date: Date,
    ...args: ScheduleArgs<H>
  ): Promise<{ jobId: string }> {
    const id = randomUUID();
    await this.queue.add(
      jobName(job),
      { payload: args[0], runAt: date.toISOString() },
      {
        jobId: id,
        delay: Math.max(0, date.getTime() - Date.now()),
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: true,
      },
    );
    return { jobId: id };
  }

  async getExecutionDate(jobId: string): Promise<Date> {
    return new Date((await this.require(jobId)).data.runAt);
  }

  async update(jobId: string, date: Date): Promise<void> {
    const job = await this.require(jobId);
    if (!(await job.isDelayed()))
      throw new Error(`Job ${jobId} can no longer be rescheduled`);
    await job.updateData({ ...job.data, runAt: date.toISOString() });
    await job.changeDelay(Math.max(0, date.getTime() - Date.now()));
  }

  async cancel(jobId: string): Promise<void> {
    try {
      await (await this.queue.getJob(jobId))?.remove();
    } catch {
      /* already running */
    }
  }

  private async require(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    return job;
  }
}
