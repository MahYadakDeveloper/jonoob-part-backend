import { HashService } from '@infra/crypto-hash';
import { JwtModule } from '@infra/crypto-jwt';
import { SMS_QUEUE_NAME } from '@infra/messaging-queue/constants';
import { RateLimitModule } from '@infra/rate-limit';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    JwtModule,
    RateLimitModule,
    BullModule.registerQueue({
      name: SMS_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 500 },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    }),
  ],
  providers: [
    {
      provide: HashService,
      useFactory: () => new HashService(12),
    },
  ],
})
export class AuthenticationModule {}
