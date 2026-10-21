import { COURIER_API, type CourierApi } from '@feature/actors-api/courier';
import { CUSTOMERS_API, type CustomersApi } from '@feature/actors-api/customer';
import { MANAGER_API, type ManagerApi } from '@feature/actors-api/manager';
import {
  AuthenticationApi,
  AuthenticationInput,
  AuthenticationResult,
} from '@feature/shared/contracts/authentication.api';
import { AuthenticatedUser } from '@feature/shared/types/authenticated-user';
import { HashService } from '@infra/crypto-hash';
import { JwtService, TokenPayload } from '@infra/crypto-jwt';
import { OtpGenerator } from '@infra/crypto-otp';
import { SMS_QUEUE_NAME } from '@infra/messaging-queue/constants';
import { SmsJobs } from '@infra/messaging-queue/job-types';
import {
  TokenBucketConfig,
  TokenBucketRateLimitService,
} from '@infra/rate-limit';
import { RedlockSynchronizer } from '@infra/synchronizer';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { Queue } from 'bullmq';
import authConfig from './auth.config';
import { OtpStore } from './otp/otp.store';
import { SmsSendOtpJobPayload } from './sms/sms-opt.template';

export type RefreshClaim = AuthenticatedUser;

@Injectable()
export class AuthenticationService implements AuthenticationApi {
  private readonly logger = new Logger(AuthenticationService.name);
  // otp
  private readonly otpRateLimitConfig: TokenBucketConfig = {
    maxTokens: 1,
    refillRate: 8.333e-3, // refill a token in 2 min
  };
  private readonly otpTtlSeconds = 300; // 5 min
  private readonly otpLength = 4;

  private readonly phoneNumberRateLimitConfig: TokenBucketConfig = {
    maxTokens: 3,
    refillRate: 3.333e-3, // refill a token in 5 min
  };

  private readonly ipRateLimitConfig: TokenBucketConfig = {
    maxTokens: 10,
    refillRate: 3.333e-3, // refill a token in 5 min
  };

  private readonly verificationRateLimitConfig: TokenBucketConfig = {
    maxTokens: 10,
    refillRate: 1.111e-3,
  };
  private readonly verificationIpRateLimitConfig: TokenBucketConfig = {
    maxTokens: 5,
    refillRate: 1.111e-3,
  };

  private readonly hashingRateLimitConfig: TokenBucketConfig = {
    maxTokens: 3,
    refillRate: 3.333e-3, // refill a token in 5 min
  };

  private readonly verifyTokenExpiresIn = 300; // 5 min
  private readonly accessTokenExpiresIn = 1800; // 30 min
  private readonly refreshTokenExpiresIn = 604800; // 7 days

  constructor(
    @Inject(MANAGER_API) private readonly manager: ManagerApi,
    @Inject(COURIER_API) private readonly courier: CourierApi,
    @Inject(CUSTOMERS_API) private readonly customers: CustomersApi,
    private readonly otps: OtpStore,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly rateLimit: TokenBucketRateLimitService,
    private readonly otpGenerator: OtpGenerator,
    private readonly synchronizer: RedlockSynchronizer,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
    @InjectQueue(SMS_QUEUE_NAME) private readonly smsQueue: Queue,
  ) {}

  async authenticate({
    token,
  }: AuthenticationInput): Promise<AuthenticationResult> {
    const payload = await this.jwtService.verify(token, 'access');
    if (!payload) return { user: null };

    return { user: payload as unknown as AuthenticatedUser };
  }

  /**
   * [NOTE]
   * This is responsible too for `Able to re-request and check` functionality
   * so there no need for separated method for check requirement(otp-resending)
   *
   * [TODO] Add phone number validation inside the endpoint controller
   */
  async request(phone: string, ip: string) {
    this.logger.log('from otp request method');
    const verificationRateLimit = await this.rateLimit.check(
      `verification:phone:${phone}`,
      this.verificationRateLimitConfig,
    );

    this.logger.log('before verificationRateLimit check 2');
    if (!verificationRateLimit.allowed)
      throw this.tooManyRequests(
        'exceeded_attempts',
        verificationRateLimit.retryAfter,
      );

    this.logger.log('after verificationRateLimit check');

    const result = await this.rateLimit.attempt([
      {
        key: `otp:${phone}`,
        config: this.otpRateLimitConfig,
      },
      {
        key: `phone:${phone}`,
        config: this.phoneNumberRateLimitConfig,
      },
      {
        key: `ip:${ip}`,
        config: this.ipRateLimitConfig,
      },
    ]);

    if (!result.allowed) {
      throw this.tooManyRequests(
        'reached_limit',
        result.retryAfter,
        result.bucketKey.split(':')[0],
      );
    }

    const otp = this.otpGenerator.generate(this.otpLength);

    await this.otps.set(
      phone,
      {
        hash: await this.hashService.hash(otp),
      },
      this.otpTtlSeconds,
    );

    await this.smsQueue.add(SmsJobs.Send, {
      to: phone,
      template: 'auth.otp',
      data: {
        otp,
      },
    } satisfies SmsSendOtpJobPayload);
  }

  async verify({
    phoneNumber,
    ip,
    otp,
  }: {
    phoneNumber: string;
    ip: string;
    otp: string;
  }) {
    const result = await this.rateLimit.attempt([
      {
        key: `verification:phone:${phoneNumber}`,
        config: this.verificationRateLimitConfig,
      },
      {
        key: `verification:ip:${ip}`,
        config: this.verificationIpRateLimitConfig,
      },
    ]);

    if (!result.allowed) {
      await this.otps.delete(phoneNumber);
      throw this.tooManyRequests('exceeded_attempts', result.retryAfter);
    }

    const record = await this.otps.get(phoneNumber);

    if (!record) throw new BadRequestException({ reason: 'otp_not_found' });

    const valid = await this.hashService.verify(otp, record.hash);

    if (!valid) throw new UnauthorizedException({ reason: 'invalid_otp' });

    await this.otps.delete(phoneNumber);

    const verifyToken = await this.jwtService.issue({
      type: 'verify',
      subject: phoneNumber,
      expiresIn: this.verifyTokenExpiresIn,
    });

    return { verifyToken };
  }

  private tooManyRequests(
    reason: string,
    retryAfter?: number,
    reachedLimit?: string,
  ) {
    return new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        reason,
        retryAfter, // seconds
        reachedLimit,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  /**
   *
   */
  async signIn({ verifyToken }: { verifyToken: string }) {
    const payload = this.jwtService.decode(verifyToken);
    if (!payload) throw new UnauthorizedException('Invalid verification token');

    return await this.synchronizer.executeExclusive(
      `${AuthenticationService.name}:sign-in:${payload.jti}`,
      async () => {
        const payload = await this.jwtService.verify(verifyToken, 'verify');
        if (!payload)
          throw new UnauthorizedException(
            'Verification token is invalid, expired, or already used',
          );

        // payload.sub is a phone number, because it comes from verify token
        const customer = await this.customers.getByPhone({
          phone: payload.sub,
        });

        const accessToken = await this.jwtService.issue({
          type: 'access',
          subject: customer.id,
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            role: 'customer',
            id: customer.id,
          } satisfies AuthenticatedUser,
        });

        const refreshToken = await this.jwtService.issue({
          type: 'refresh',
          subject: customer.id,
          expiresIn: this.refreshTokenExpiresIn,
          claims: {
            role: 'customer',
            id: customer.id,
          } satisfies RefreshClaim,
        });

        await this.jwtService.revoke(verifyToken, 'verify');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  async courierSingIn({
    verifyToken,
    password,
  }: {
    verifyToken: string;
    password: string;
  }) {
    const payload = this.jwtService.decode(verifyToken);
    if (!payload) throw new UnauthorizedException('Invalid verification token');
    return await this.synchronizer.executeExclusive(
      `${AuthenticationService.name}:courier-sign-in:${payload.jti}`,
      async () => {
        const payload = await this.jwtService.verify(verifyToken, 'verify');
        if (!payload)
          throw new UnauthorizedException(
            'Verification token is invalid, expired, or already used',
          );

        const courier = await this.courier.getByPhone({ phone: payload.sub });

        const verified = await this.hashService.verify(
          password,
          courier.password,
        );

        if (!verified) throw new UnauthorizedException('Invalid credentials');

        const accessToken = await this.jwtService.issue({
          type: 'access',
          subject: courier.id,
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            role: 'courier',
            ...courier,
          } satisfies AuthenticatedUser,
        });

        const refreshToken = await this.jwtService.issue({
          type: 'refresh',
          subject: courier.id,
          expiresIn: this.refreshTokenExpiresIn,
          claims: {
            role: 'courier',
            id: courier.id,
          } satisfies RefreshClaim,
        });

        await this.jwtService.revoke(verifyToken, 'verify');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  /**
   *
   */
  async managerSignIn({
    verifyToken,
    password,
  }: {
    verifyToken: string;
    password: string;
  }) {
    const payload = this.jwtService.decode(verifyToken);
    if (!payload) throw new UnauthorizedException('Invalid verification token');

    return await this.synchronizer.executeExclusive(
      `${AuthenticationService.name}:manager-sign-in:${payload.jti}`,
      async () => {
        const payload = await this.jwtService.verify(verifyToken, 'verify');
        if (!payload)
          throw new UnauthorizedException(
            'Verification token is invalid, expired, or already used',
          );

        const manager = await this.manager.getByPhone({ phone: payload.sub });

        const verified = await this.hashService.verify(
          password,
          manager.hashedPassword,
        );
        if (!verified) throw new UnauthorizedException('Invalid credentials');

        const accessToken = await this.jwtService.issue({
          type: 'access',
          subject: manager.id,
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            role: 'manager',
            ...manager,
          } satisfies AuthenticatedUser,
        });

        const refreshToken = await this.jwtService.issue({
          type: 'refresh',
          subject: manager.id,
          expiresIn: this.refreshTokenExpiresIn,
          claims: {
            role: 'manager',
            id: manager.id,
          } satisfies RefreshClaim,
        });

        await this.jwtService.revoke(verifyToken, 'verify');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  async adminSignIn({
    verifyToken,
    secretKey,
  }: {
    verifyToken: string;
    secretKey: string;
  }) {
    const payload = this.jwtService.decode(verifyToken);
    if (!payload) {
      this.logger.warn('Admin sign-in rejected: undecodable verify token');
      throw new UnauthorizedException('Invalid verification token');
    }

    return await this.synchronizer.executeExclusive(
      `${AuthenticationService.name}:admin-sign-in:${payload.jti}`,
      async () => {
        const payload = await this.jwtService.verify(verifyToken, 'verify');
        if (!payload) {
          throw new UnauthorizedException('Invalid verification token');
        }

        const isAdmin = this.config.adminPhoneNumbers.includes(payload.sub);
        if (!isAdmin) {
          this.logger.warn(
            `Admin sign-in rejected: ${payload.sub} is not in ADMIN_PHONE_NUMBERS`,
          );
          throw new UnauthorizedException('Invalid credentials');
        }

        const verified = await this.hashService.verify(
          secretKey,
          this.config.adminSecretKey,
        );
        if (!verified) {
          throw new UnauthorizedException('Invalid credentials');
        }

        const accessToken = await this.jwtService.issue({
          type: 'access',
          subject: 'admin',
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            role: 'admin',
          } satisfies AuthenticatedUser,
        });

        const refreshToken = await this.jwtService.issue({
          type: 'refresh',
          subject: 'admin',
          expiresIn: this.refreshTokenExpiresIn,
          claims: {
            role: 'admin',
          } satisfies RefreshClaim,
        });

        await this.jwtService.revoke(verifyToken, 'verify');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  /**
   *
   */
  async signUp({
    fullName,
    verifyToken,
  }: {
    fullName: string;
    verifyToken: string;
  }) {
    const payload = this.jwtService.decode(verifyToken);
    if (!payload) throw new UnauthorizedException('Invalid verification token');

    return this.synchronizer.executeExclusive(
      `${AuthenticationService.name}:sign-up:${payload.jti}`,
      async () => {
        const payload = await this.jwtService.verify(verifyToken, 'verify');
        if (!payload)
          throw new UnauthorizedException(
            'Verification token is invalid, expired, or already used',
          );

        const { id: customerId } =
          await this.customers.createConsumerTypeCustomer({
            fullName,
            phone: payload.sub,
          });

        const accessToken = await this.jwtService.issue({
          type: 'access',
          subject: customerId,
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            role: 'customer',
            id: customerId,
          } satisfies AuthenticatedUser,
        });

        const refreshToken = await this.jwtService.issue({
          type: 'refresh',
          subject: customerId,
          expiresIn: this.refreshTokenExpiresIn,
          claims: {
            role: 'customer',
            id: customerId,
          } satisfies RefreshClaim,
        });

        await this.jwtService.revoke(verifyToken, 'verify');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  async refresh({ oldRefreshToken }: { oldRefreshToken: string }) {
    const payload = this.jwtService.decode(oldRefreshToken);
    if (!payload) throw new UnauthorizedException('Invalid refresh token');

    return await this.synchronizer.executeExclusive(
      `${AuthenticationService.name}:refresh:${payload.jti}`,
      async () => {
        const payload = (await this.jwtService.verify(
          oldRefreshToken,
          'refresh',
        )) as (TokenPayload & RefreshClaim) | null;

        if (!payload)
          throw new UnauthorizedException(
            'Refresh token is invalid, expired, or already used',
          );

        let accessToken: string;
        let refreshToken: string;
        switch (payload.role) {
          case 'admin':
            accessToken = await this.jwtService.issue({
              type: 'access',
              subject: 'admin',
              expiresIn: this.accessTokenExpiresIn,
              claims: {
                role: 'admin',
              } satisfies AuthenticatedUser,
            });

            refreshToken = await this.jwtService.issue({
              type: 'refresh',
              subject: 'admin',
              expiresIn: this.refreshTokenExpiresIn,
              claims: {
                role: 'admin',
              } satisfies AuthenticatedUser,
            });
            break;
          case 'manager':
            const manager = await this.manager.getById({
              managerId: payload.id,
            });

            accessToken = await this.jwtService.issue({
              type: 'access',
              subject: manager.id,
              expiresIn: this.accessTokenExpiresIn,
              claims: {
                role: 'manager',
                ...manager,
              } satisfies AuthenticatedUser,
            });

            refreshToken = await this.jwtService.issue({
              type: 'refresh',
              subject: manager.id,
              expiresIn: this.refreshTokenExpiresIn,
              claims: {
                role: 'manager',
                id: manager.id,
              } satisfies RefreshClaim,
            });
            break;
          case 'courier':
            const courier = await this.courier.getById({
              courierId: payload.id,
            });

            accessToken = await this.jwtService.issue({
              type: 'access',
              subject: courier.id,
              expiresIn: this.accessTokenExpiresIn,
              claims: {
                role: 'courier',
                ...courier,
              } satisfies AuthenticatedUser,
            });

            refreshToken = await this.jwtService.issue({
              type: 'refresh',
              subject: courier.id,
              expiresIn: this.refreshTokenExpiresIn,
              claims: {
                role: 'courier',
                id: courier.id,
              } satisfies RefreshClaim,
            });
            break;
          case 'customer':
            // sub here is customer id, because it comes from refresh token
            const customer = await this.customers.getById({
              customerId: payload.sub,
            });

            accessToken = await this.jwtService.issue({
              type: 'access',
              subject: customer.id,
              expiresIn: this.accessTokenExpiresIn,
              claims: {
                role: 'customer',
                ...customer,
              } satisfies AuthenticatedUser,
            });

            refreshToken = await this.jwtService.issue({
              type: 'refresh',
              subject: customer.id,
              expiresIn: this.refreshTokenExpiresIn,
              claims: {
                role: 'customer',
                id: customer.id,
              } satisfies RefreshClaim,
            });
        }

        await this.jwtService.revoke(oldRefreshToken, 'refresh');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  async hash({ password }: { password: string }) {
    return await this.synchronizer.executeExclusive(
      'auth:hashing',
      async () => {
        const result = await this.rateLimit.attempt([
          { key: 'auth:hashing', config: this.hashingRateLimitConfig },
        ]);

        if (!result.allowed)
          throw this.tooManyRequests('rate limited reached max');

        return await this.hashService.hash(password);
      },
    );
  }
}
