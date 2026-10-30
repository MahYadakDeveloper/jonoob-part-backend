import { OtpSmsPayload } from '@feature/authentication-sms/sms-opt.template';
import { Command } from '@feature/shared/cqrs';
import {
    assertNotNull
} from '@feature/shared/utils/assertions';
import { constantTimeEqual } from '@infra/crypto/hmac';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from '../authentication.config';
import { AuthStore } from '../authentication.store';
import { decodeDigest, otpDigest } from './utils/otp-digest';
import { otpChallengeStoreKey } from './utils/otp-key-store';

export type OtpVerifyInput = {
  challengeToken: string;
  otp: string;
};

export type OtpVerifyOutput = {
  verifyToken: string;
};

const OTP_MAX_ATTEMPTS = 5;

export class OtpVerifyCommand implements Command<
  OtpVerifyInput,
  OtpVerifyOutput
> {
  constructor(
    private readonly store: AuthStore,
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY)
    private readonly cfg: ConfigType<typeof authConfig>,
  ) {}

  async execute({
    challengeToken,
    otp,
  }: OtpVerifyInput): Promise<OtpVerifyOutput> {
    const claims = await this.jwt.verifyAsync(challengeToken, {
      secret: this.cfg.challengeSecret,
    });
const stored = await this.store.get(otpChallengeStoreKey(claims.jti));
    assertNotNull(stored, new Error('Otp expired!')); // TODO Add proper error
    const actual = otpDigest(this.cfg.challengeSecret, claims.jti, claims.phone, otp)
    const expected = decodeDigest(stored)

    if(!constantTimeEqual(actual, expected)) throw new Error('Otp is not valid')

    const verifyToken = await this.jwt.signAsync(
      { phone, typ: 'otp-challenge' },
      { secret: this.cfg.verifySecret, jwtid: claims.jti, expiresIn:  },
    );

    return { verifyToken };
  }
}

export function assertDigestEqual(
  expected: Buffer,
  actual: Buffer,
  exception: ,
): void {
}