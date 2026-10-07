import { CacheInvalidationQueueName } from '@jonoob-part/contracts';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SMS_QUEUE_NAME } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: Number(config.getOrThrow('REDIS_PORT')),
          username: config.get<string>('REDIS_USERNAME') || undefined,
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(config.get('REDIS_DB') ?? 0),
        },
        prefix: config.get<string>('QUEUE_PREFIX', 'bull'),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential' as const, delay: 500 },
          removeOnComplete: true,
          removeOnFail: 1000,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: SMS_QUEUE_NAME },
      {
        name: CacheInvalidationQueueName,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: 1000,
        },
      },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
