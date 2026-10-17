import { QueueModule } from '@infra/messaging-queue';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BullmqJobScheduler } from './bullmq-job-scheduler';
import { SCHEDULED_QUEUE } from './contracts';

@Module({
  imports: [QueueModule, BullModule.registerQueue({ name: SCHEDULED_QUEUE })],
  providers: [BullmqJobScheduler],
  exports: [BullmqJobScheduler],
})
export class SchedulerModule {}
