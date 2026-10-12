import { HashService } from '@infra/crypto-hash';
import { JwtModule } from '@infra/crypto-jwt';
import { OtpGenerator } from '@infra/crypto-otp';
import { RedisModule } from '@infra/db-redis';
import { SMS_QUEUE_NAME } from '@infra/messaging-queue/constants';
import { RateLimitModule } from '@infra/rate-limit';
import { SynchronizerModule } from '@infra/synchronizer';
import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from './auth.config';
import { AuthenticationService } from './auth.service';
import { OtpStore } from './otp/otp.store';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    RedisModule,
    JwtModule,
    RateLimitModule,
    SynchronizerModule,
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
    OtpStore,
    OtpGenerator,
    AuthenticationService,
    {
      provide: HashService,
      useFactory: () => new HashService(12),
    },
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {
  static forRoot(options: ModuleMetadata): DynamicModule {
    return {
      module: AuthenticationModule,
      imports: [...(options.imports ?? [])],
    };
  }
}
