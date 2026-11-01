import { RegistrationHttpModule } from '@feature/authentication-registration-http';
import {
  BunPasswordHasher,
  BunPasswordHasherOptions,
} from '@infra/crypto/password-hasher';
import { BullmqSms } from '@infra/messaging-sms';
import { RedisRateLimitService } from '@infra/rate-limit';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import authCfg from './authentication.config';
import { AuthenticationController } from './authentication.controller';
import { AuthStore } from './authentication.store';
import { AdminSecretSignInCommand } from './commands/admin-secret-sing-in.command';
import { OtpVerifyCommand } from './commands/opt-verify.command';
import { OtpRequestCommand } from './commands/otp-request.command';
import { OtpSignInCommand } from './commands/otp-sign-in.command';
import { RefreshCommand } from './commands/refresh.command';
import { JwtAuthService } from './jwt-auth.service';
import { UserRepository } from './user.repository';

const passwordHasherOptions: BunPasswordHasherOptions = {
  algorithm: 'argon2id',
  memoryCost: 19456,
  timeCost: 2,
};

@Module({
  imports: [
    ConfigModule.forFeature(authCfg),
    JwtModule.register({}),
    RegistrationHttpModule.forFeature({
      passwordHasher: {
        provide: BunPasswordHasher,
        useFactory: () => new BunPasswordHasher(passwordHasherOptions),
      },
    }),
  ],
  providers: [
    {
      provide: BunPasswordHasher,
      useFactory: () => new BunPasswordHasher(passwordHasherOptions),
    },

    RefreshCommand,
    AdminSecretSignInCommand,
    OtpSignInCommand,
    OtpVerifyCommand,
    OtpRequestCommand,
    UserRepository,

    JwtAuthService,
    AuthStore,
    RedisRateLimitService,
    BullmqSms,
  ],
  controllers: [AuthenticationController],
  exports: [JwtAuthService],
})
export class AuthenticationHttpModule {}
