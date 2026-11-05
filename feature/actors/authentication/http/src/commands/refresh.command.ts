import { Command } from '@feature/shared/cqrs';
import { AuthenticatedUser } from '../authenticated-user';
import { RefreshDto } from '../authentication.dto';
import { AuthTokenInvalidError } from '../authentication.errors';
import { AuthTokens, JwtAuthService } from '../jwt-auth.service';
import { AuthStore } from '../authentication.store';
import { secondsUntil } from '../utils/expires-in';
import { Injectable } from '@nestjs/common';

const STORE_KEY = 'revoked';

@Injectable()
export class RefreshCommand implements Command<RefreshDto, AuthTokens> {
  constructor(
    private readonly jwtAuth: JwtAuthService,
    private readonly store: AuthStore,
  ) {}
  async execute(input: RefreshDto): Promise<AuthTokens> {
    const claims = await this.jwtAuth.verify<AuthenticatedUser>(
      input.refreshToken,
      'refresh',
    );

    const first = await this.store.setIfAbsent(
      `${STORE_KEY}:${claims.jti}`,
      claims.jti,
      secondsUntil(claims.exp),
    );
    if (first) throw new AuthTokenInvalidError('revoked');

    return this.jwtAuth.issue({ id: claims.id, role: claims.role });
  }
}
