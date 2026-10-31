import { Command } from '@feature/shared/cqrs';
import { BunPasswordHasher } from '@infra/crypto/password-hasher';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import authCfg from '../authentication.config';
import {
  AuthInvalidCredentialsError,
  AuthTokenInvalidError,
} from '../authentication.errors';
import { AuthStore } from '../authentication.store';
import { AuthTokens, JwtAuthService } from '../jwt-auth.service';
import { UserRepository } from '../user.repository';
import { secondsUntil } from '../utils/expires-in';

const STORE_KEY = 'revoked';

@Injectable()
export class ManagerPasswordSignInCommand implements Command<
  { verifyToken: string; password: string },
  AuthTokens
> {
  constructor(
    private readonly jwtAuth: JwtAuthService,
    private readonly store: AuthStore,
    private readonly hasher: BunPasswordHasher,
    private readonly users: UserRepository,
    @Inject(authCfg.KEY)
    private readonly cfg: ConfigType<typeof authCfg>,
  ) {}

  async execute(input: {
    verifyToken: string;
    password: string;
  }): Promise<AuthTokens> {
    const claims = await this.jwtAuth.verify(input.verifyToken, 'verify');

    const first = await this.store.setIfAbsent(
      `${STORE_KEY}:${claims.jti}`,
      claims.jti,
      secondsUntil(claims.exp),
    );
    if (first) throw new AuthTokenInvalidError('revoked');

    const manager = await this.users.getManagerByPhone(claims.sub);

    const verified = await this.hasher.verify(
      input.password,
      manager.hashedPassword,
    );

    if (!verified) throw new AuthInvalidCredentialsError();

    return this.jwtAuth.issue({ id: manager.id, role: 'manager' });
  }
}
