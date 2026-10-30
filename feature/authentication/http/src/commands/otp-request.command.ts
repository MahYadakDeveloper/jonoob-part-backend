import { OtpSmsPayload } from '@feature/authentication-sms/sms-opt.template';
import { Command } from '@feature/shared/cqrs';
import { generateNumericCode } from '@infra/crypto/random';
import { BullmqSms } from '@infra/messaging-sms';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import authConfig from '../authentication.config';
import { AuthStore } from '../authentication.store';
import { encodeDigest, otpDigest } from './utils/otp-digest';
import { otpChallengeStoreKey } from './utils/otp-key-store';

export type OtpRequestInput = {
  phone: string;
};

export type OtpRequestOutput = {
  challengeToken: string;
};

const OTP_TTL = '3m';
const OTP_LENGTH = 4;
const generateOtpCode = () => generateNumericCode(OTP_LENGTH);

export class OtpRequestCommand implements Command<
  OtpRequestInput,
  OtpRequestOutput
> {
  constructor(
    private readonly store: AuthStore,
    private readonly jwt: JwtService,
    private readonly sms: BullmqSms,
    @Inject(authConfig.KEY)
    private readonly cfg: ConfigType<typeof authConfig>,
  ) {}

  async execute({ phone }: OtpRequestInput): Promise<OtpRequestOutput> {
    const jti = randomUUID();
    const otp = generateOtpCode();
    const digest = otpDigest(this.cfg.challengeSecret, jti, phone, otp);

    await this.store.set(
      otpChallengeStoreKey(jti),
      encodeDigest(digest),
      OTP_TTL,
    );

    await this.sms.enqueue({
      to: phone,
      template: 'auth.otp',
      data: {
        otp,
      },
    } satisfies OtpSmsPayload);

    const challengeToken = await this.jwt.signAsync(
      { phone },
      { secret: this.cfg.challengeSecret, jwtid: jti, expiresIn: OTP_TTL },
    );

    return { challengeToken };
  }
}
