import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AuthenticatedUser } from './authenticated-user';
import authCfg from './authentication.config';
import { AuthTokenInvalidError } from './authentication.errors';
import { TokenPayload } from './types/token-payload';

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

  async verify<T = {}>(
    token: string,
    typ: 'challenge' | 'verify' | 'access' | 'refresh',
  ) {
    try {
      return await this.jwt.verifyAsync<TokenPayload & T>(token, {
        secret: this.cfg[`${typ}Secret`],
      });
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new AuthTokenInvalidError('expired');
      }
      if (e instanceof JsonWebTokenError) {
        throw new AuthTokenInvalidError('invalid');
      }
      throw e;
    }
  }

  async issue(user: AuthenticatedUser): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync<AuthenticatedUser>(
        { id: user.id, role: user.role },
        {
          secret: this.cfg.accessSecret,
          jwtid: randomUUID(),
          subject: user.id,
          expiresIn: this.cfg.accessTokenExpiresIn,
        },
      ),
      this.jwt.signAsync<AuthenticatedUser>(
        { id: user.id, role: user.role },
        {
          secret: this.cfg.refreshSecret,
          jwtid: randomUUID(),
          subject: user.id,
          expiresIn: this.cfg.refreshTokenExpiresIn,
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
