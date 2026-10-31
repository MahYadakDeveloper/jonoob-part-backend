import { Command } from '@feature/shared/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from '../authentication.config';
import { OtpChallengeService } from '../otp-challenge.service';

export type OtpRequestInput = {
  phone: string;
};

export type OtpRequestOutput = {
  challengeToken: string;
};

@Injectable()
export class OtpRequestCommand implements Command<
  OtpRequestInput,
  OtpRequestOutput
> {
  constructor(
    private readonly otpChallenge: OtpChallengeService,
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY)
    private readonly cfg: ConfigType<typeof authConfig>,
  ) {}

  async execute({ phone }: OtpRequestInput): Promise<OtpRequestOutput> {
    const { challengeId, expiresIn } = await this.otpChallenge.start(phone);

    const challengeToken = await this.jwt.signAsync(
      {},
      {
        secret: this.cfg.challengeSecret,
        subject: phone,
        jwtid: challengeId,
        expiresIn,
      },
    );
    return { challengeToken };
  }
}
