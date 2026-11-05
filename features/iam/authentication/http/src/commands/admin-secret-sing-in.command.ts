import { Command } from '@feature/shared/cqrs';
import { assertSafeEqual } from '@feature/shared/utils/assertions';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import authCfg from '../authentication.config';
import {
  AuthInvalidCredentialsError,
  AuthTokenInvalidError,
} from '../authentication.errors';
import { AuthTokens, JwtAuthService } from '../jwt-auth.service';
import { AuthStore } from '../authentication.store';
import { UserRepository } from '../user.repository';
import { secondsUntil } from '../utils/expires-in';

const STORE_KEY = 'revoked';

@Injectable()
export class AdminSecretSignInCommand implements Command<
  { verifyToken: string; secretKey: string },
  AuthTokens
> {
  constructor(
    private readonly jwtAuth: JwtAuthService,
    private readonly store: AuthStore,
    private readonly users: UserRepository,
    @Inject(authCfg.KEY)
    private readonly cfg: ConfigType<typeof authCfg>,
  ) {}

  async execute(input: {
    verifyToken: string;
    secretKey: string;
  }): Promise<AuthTokens> {
    const claims = await this.jwtAuth.verify(input.verifyToken, 'verify');

    const first = await this.store.setIfAbsent(
      `${STORE_KEY}:${claims.jti}`,
      claims.jti,
      secondsUntil(claims.exp),
    );
    if (first) throw new AuthTokenInvalidError('revoked');

    const isAdmin = this.cfg.adminPhoneNumbers.includes(claims.sub);
    if (!isAdmin) {
      throw new AuthInvalidCredentialsError();
    }

    assertSafeEqual(
      this.cfg.adminSecretKey,
      input.secretKey,
      AuthInvalidCredentialsError,
    );

    const id = await this.users.findOrCreateAdminByPhoneAndReturnId(claims.sub);

    return this.jwtAuth.issue({ id, role: 'admin' });
  }
}
