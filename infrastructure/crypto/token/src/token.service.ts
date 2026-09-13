import { IssueTokenOptions, TokenPayload, TokenService, TokenType } from '@feature/auth-token';
import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { type RedisClientType } from 'redis';
import tokenConfig from './token.config';

@Injectable()
export class TokenServiceImpl implements TokenService {
  constructor(
    private readonly redis: RedisClientType,
    private readonly jwt: JwtService,
    @Inject(tokenConfig.KEY)
    private readonly config: ConfigType<typeof tokenConfig>,
  ) {}

  async issue(options: IssueTokenOptions): Promise<string> {
    return this.jwt.sign(options.claims ?? {}, {
      jwtid: randomUUID(),
      expiresIn: options.expiresIn,
      subject: options.subject,
      secret: this.config[`${options.type}Secret`],
    });
  }

  decode(token: string): TokenPayload | null {
    try {
      const payload = this.jwt.decode(token);

      if (!payload || typeof payload !== 'object') return null;

      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  async verify(token: string, type: TokenType): Promise<TokenPayload | null> {
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config[`${type}Secret`],
      }) as TokenPayload;

      const revoked = await this.redis.get(payload.jti);

      if (revoked !== null) return null;

      return payload;
    } catch {
      return null;
    }
  }

  async revoke(token: string, type: TokenType): Promise<void> {
    const payload = this.jwt.verify(token, {
      secret: this.config[`${type}Secret`],
    }) as TokenPayload;

    await this.redis.set(payload.jti, '1', {
      expiration: {
        type: 'EXAT',
        value: payload.exp,
      },
    });
  }
}
