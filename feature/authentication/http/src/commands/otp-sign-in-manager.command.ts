import { Command } from '@feature/shared/cqrs';
import { AuthTokens, JwtAuthService } from '../authentication.service';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../user.repository';
import { OtpChallengeService } from '../otp-challenge.service';
import { Inject } from '@nestjs/common';
import authCfg from '../authentication.config';
import type { ConfigType } from '@nestjs/config';
import { TokenPayload } from '../types/token-payload';

export class OtpSignInManagerCommand implements Command<
  { challengeToken: string },
  AuthTokens
> {
  constructor(
    private readonly jwtAuth: JwtAuthService,
    private readonly jwt: JwtService,
    private readonly users: UserRepository,
    private readonly otpChallenge: OtpChallengeService,
    @Inject(authCfg.KEY)
    private readonly cfg: ConfigType<typeof authCfg>,
  ) {}

  async execute({
    challengeToken,
    otp,
  }: {
    challengeToken: string;
    otp: string;
  }): Promise<AuthTokens> {
    const claims = await this.jwt.verifyAsync<TokenPayload>(challengeToken, {
      secret: this.cfg.challengeSecret,
    });

    await this.otpChallenge.verify(claims.jti, claims.sub, otp);

    const { managerId } = await this.users.getManagerByPhone(claims.sub);

    return await this.jwtAuth.issue({ id: managerId, role: 'manager' });
  }
}
