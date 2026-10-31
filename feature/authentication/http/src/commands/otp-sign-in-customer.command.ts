import { Command } from '@feature/shared/cqrs';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthService } from '../authentication.service';
import { OtpChallengeService } from '../otp-challenge.service';
import { TokenPayload } from '../types/token-payload';
import { AuthTokens } from '../types/tokens';
import { UserRepository } from '../user.repository';
import authCfg from './../authentication.config';

export class OtpSignInCustomerCommand implements Command<
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

    const { customerId } = await this.users.findOrCreateCustomerByPhone(
      claims.sub,
    );

    return await this.jwtAuth.issue({ id: customerId, role: 'customer' });
  }
}
