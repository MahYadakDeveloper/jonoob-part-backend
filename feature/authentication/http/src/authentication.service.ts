import { OtpSmsPayload } from '@feature/authentication-sms/sms-opt.template';
import { hmacSha256 } from '@infra/crypto/hmac';
import { generateNumericCode } from '@infra/crypto/random';
import { BullmqSms } from '@infra/messaging-sms';
import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import authConfig from './authentication.config';
import { RedisOtpChallengeStore } from './stores/otp-challenge.store';

export interface OtpRecord {
  attempts: number;
  /**
   * Hashed OTP value.
   *
   * Never store the raw OTP.
   */
  hash: string;
}

@Injectable()
export class AuthenticationService {
  async requestOtp(input: unknown) {}

  private verify() {}
}
