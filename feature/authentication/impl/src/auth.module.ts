import { HashService } from '@infra/crypto-hash';
import { JwtModule } from '@infra/crypto-jwt';
import { OtpGenerator } from '@infra/crypto-otp';
import { RedisModule } from '@infra/db-redis';
import { QueueModule } from '@infra/messaging-queue';
import { RateLimitModule } from '@infra/rate-limit';
import { SynchronizerModule } from '@infra/synchronizer';
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
    QueueModule,
  ],
  providers: [
    OtpStore,
    OtpGenerator,
    AuthenticationService,
    {
      provide: 'AuthenticationApi',
      useExisting: AuthenticationService,
    },
    {
      provide: HashService,
      useFactory: () => new HashService(12),
    },
  ],
  exports: ['AuthenticationApi'],
})
export class AuthenticationModule {
  static forRoot(options: ModuleMetadata): DynamicModule {
    return {
      module: AuthenticationModule,
      imports: [...(options.imports ?? [])],
    };
  }
}
