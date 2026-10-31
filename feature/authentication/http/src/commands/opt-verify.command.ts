import { Command } from '@feature/shared/cqrs';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import authConfig from '../authentication.config';
import { OtpChallengeService } from '../otp-challenge.service';
import { TokenPayload } from '../types/token-payload';

export type OtpVerifyInput = {
  challengeToken: string;
  otp: string;
};

export type OtpVerifyOutput = {
  verifyToken: string;
};

export class OtpVerifyCommand implements Command<
  OtpVerifyInput,
  OtpVerifyOutput
> {
  constructor(
    private readonly otpChallenge: OtpChallengeService,
    private readonly jwt: JwtService,
    @Inject(authConfig.KEY)
    private readonly cfg: ConfigType<typeof authConfig>,
  ) {}

  async execute({
    challengeToken,
    otp,
  }: OtpVerifyInput): Promise<OtpVerifyOutput> {
    const claims = await this.jwt.verifyAsync<TokenPayload>(challengeToken, {
      secret: this.cfg.challengeSecret,
    });

    await this.otpChallenge.verify(claims.jti, claims.sub, otp);

    const verifyToken = await this.jwt.signAsync(
      {},
      {
        secret: this.cfg.verifySecret,
        jwtid: claims.jti,
        subject: claims.sub,
        expiresIn: this.cfg.verifyTokenExpiresIn,
      },
    );

    return { verifyToken };
  }
}
