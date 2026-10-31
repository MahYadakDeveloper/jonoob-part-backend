import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AuthenticatedUser } from './authenticated-user';
import authCfg from './authentication.config';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(authCfg.KEY)
    private readonly cfg: ConfigType<typeof authCfg>,
  ) {}

  async issue(user: AuthenticatedUser): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync<AuthenticatedUser>(
        { id: user.id, role: user.role },
        {
          secret: this.cfg.accessSecret,
          subject: user.id,
          expiresIn: this.cfg.accessTokenExpiresIn,
        },
      ),
      this.jwt.signAsync<AuthenticatedUser>(
        { id: user.id, role: user.role },
        {
          secret: this.cfg.refreshSecret,
          subject: user.id,
          jwtid: randomUUID(),
          expiresIn: this.cfg.refreshTokenExpiresIn,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
