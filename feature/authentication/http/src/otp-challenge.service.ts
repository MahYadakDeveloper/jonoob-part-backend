import { OtpSmsPayload } from '@feature/authentication-sms/sms-opt.template';
import { assertNotNull } from '@feature/shared/utils/assertions';
import { constantTimeEqual, hmacSha256 } from '@infra/crypto/hmac';
import { generateNumericCode } from '@infra/crypto/random';
import { BullmqSms } from '@infra/messaging-sms';
import { RedisRateLimitService } from '@infra/rate-limit';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import authCfg from './authentication.config';
import { OtpTooManyAttemptsError } from './authentication.errors';
import { AuthStore } from './authentication.store';
import { expiresInToSeconds } from './utils/expires-in';

const otpDigest = (
  secret: string,
  challengeId: string,
  phone: string,
  code: string,
) => hmacSha256(secret, 'otp', challengeId, phone, code);
const encodeDigest = (digest: Buffer): string => digest.toString('hex');
const decodeDigest = (stored: string): Buffer => Buffer.from(stored, 'hex');

export const otpChallengeStoreKey = (challengeId: string) =>
  `otp-challenge:${challengeId}`;

@Injectable()
export class OtpChallengeService {
  constructor(
    private readonly store: AuthStore,
    private readonly sms: BullmqSms,
    private readonly rateLimit: RedisRateLimitService,
    @Inject(authCfg.KEY)
    private readonly cfg: ConfigType<typeof authCfg>,
  ) {}

  async start(phone: string) {
    const challengeId = randomUUID();
    const otp = generateNumericCode(this.cfg.otpLength);
    const digest = otpDigest(this.cfg.challengeSecret, challengeId, phone, otp);

    await this.store.set(
      otpChallengeStoreKey(challengeId),
      encodeDigest(digest),
      this.cfg.otpExpiresIn,
    );

    await this.sms.enqueue({
      to: phone,
      template: 'auth.otp',
      data: {
        otp,
      },
    } satisfies OtpSmsPayload);

    return { challengeId, expiresIn: this.cfg.otpExpiresIn };
  }

  async verify(challengeId: string, phone: string, otp: string) {
    const d = await this.rateLimit.consume(`otp:verify:${challengeId}`, {
      algorithm: 'fixed-window',
      limit: this.cfg.otpMaxAttempts,
      windowSeconds: expiresInToSeconds(this.cfg.otpExpiresIn),
    });

    if (!d.allowed) {
      await this.store.delete(otpChallengeStoreKey(challengeId));
      throw new OtpTooManyAttemptsError();
    }

    const stored = await this.store.get(otpChallengeStoreKey(challengeId));

    assertNotNull(stored, new Error('Otp expired!'));

    const actual = otpDigest(this.cfg.challengeSecret, challengeId, phone, otp);
    const expected = decodeDigest(stored);

    assertOtpDigestEqual(expected, actual);
  }
}

function assertOtpDigestEqual(expected: Buffer, actual: Buffer): void {
  if (!constantTimeEqual(actual, expected)) throw new Error('Otp is not valid');
}
