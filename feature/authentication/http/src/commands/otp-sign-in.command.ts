import { Command } from '@feature/shared/cqrs';
import { AuthenticatedUser } from '../authenticated-user';
import { AuthTokens, JwtAuthService } from '../jwt-auth.service';
import { OtpChallengeService } from '../otp-challenge.service';
import { UserRepository } from '../user.repository';

export class OtpSignInCommand implements Command<
  { challengeToken: string },
  AuthTokens
> {
  constructor(
    private readonly jwtAuth: JwtAuthService,
    private readonly users: UserRepository,
    private readonly otpChallenge: OtpChallengeService,
  ) {}

  async execute({
    challengeToken,
    otp,
    role,
  }: {
    challengeToken: string;
    otp: string;
    role: Exclude<AuthenticatedUser['role'], 'admin'>;
  }): Promise<AuthTokens> {
    const claims = await this.jwtAuth.verify(challengeToken, 'challenge');

    await this.otpChallenge.verify(claims.jti, claims.sub, otp);

    let id;
    switch (role) {
      case 'manager':
        id = await this.users.getManagerIdByPhone(claims.sub);
        break;
      case 'courier':
        id = await this.users.getCourierIdByPhone(claims.sub);
        break;
      case 'customer':
        id = await this.users.findOrCreateCustomerByPhoneAndReturnId(
          claims.sub,
        );
    }

    return await this.jwtAuth.issue({ id, role });
  }
}
