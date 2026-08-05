import { CacheInvalidationQueueName } from '@jonoob-part/contracts';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    // BullMQ is configured in AppModule via BullModule.forRoot(),
    // so only the queue needs to be registered here.
    BullModule.registerQueue(
      {
        name: 'events',
      },
      {
        name: CacheInvalidationQueueName,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      },
    ),
  ],
})
export class QueueModule {}
