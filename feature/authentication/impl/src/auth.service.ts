import { type HashService } from '@feature/auth-hashing';
import { type RateLimitService, TokenBucketConfig } from '@feature/auth-rate-limit';
import { type SmsService } from '@feature/auth-sms';
import { TokenPayload, type TokenService } from '@feature/auth-token';
import { CustomerType, type OtpGenerator, type Synchronizer } from '@feature/common';
import { type CustomersApi } from '@feature/customer-api';
import { type ManagerApi } from '@feature/manager-api';
import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import authConfig from './auth.config';
import { AuthClaims } from './auth.types';
import { type OtpStore } from './port/otp.store';

@Injectable()
export class AuthService {
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
    maxTokens: 5,
    refillRate: 1.111e-3,
  };
  private readonly verificationIpRateLimitConfig: TokenBucketConfig = {
    maxTokens: 5,
    refillRate: 1.111e-3,
  };

  private readonly verifyTokenExpiresIn = 300; // 5 min
  private readonly accessTokenExpiresIn = 1800; // 30 min
  private readonly refreshTokenExpiresIn = 604800; // 7 days

  constructor(
    private readonly customers: CustomersApi,
    private readonly manager: ManagerApi,
    private readonly otps: OtpStore,
    private readonly tokenService: TokenService,
    private readonly hashService: HashService,
    private readonly rateLimit: RateLimitService,
    private readonly sms: SmsService,
    private readonly otpGenerator: OtpGenerator,
    private readonly synchronizer: Synchronizer,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  /**
   * [NOTE]
   * This is responsible too for `Able to re-request and check` functionality
   * so there no need for separated method for check requirement(otp-resending)
   *
   * [TODO] Add phone number validation inside the endpoint controller
   */
  async request({ phoneNumber, ip }: { phoneNumber: string; ip: string }) {
    const verificationRateLimit = await this.rateLimit.check(
      `verification:phone:${phoneNumber}`,
      this.verificationRateLimitConfig,
    );

    if (!verificationRateLimit.allowed)
      return {
        succeed: false,
        reason: 'exceeded_attempts',
        retryAfter: verificationRateLimit.retryAfter,
      };

    const result = await this.rateLimit.attempt([
      {
        key: `otp:${phoneNumber}`,
        config: this.otpRateLimitConfig,
      },
      {
        key: `phone:${phoneNumber}`,
        config: this.phoneNumberRateLimitConfig,
      },
      {
        key: `ip:${ip}`,
        config: this.ipRateLimitConfig,
      },
    ]);

    if (!result.allowed) {
      return {
        succeed: false,
        reason: 'reached_limit',
        reachedLimit: result.bucketKey.split(':')[0],
        retryAfter: result.retryAfter,
      };
    }

    const otp = this.otpGenerator.generate(this.otpLength);

    await this.otps.set(
      phoneNumber,
      {
        hash: await this.hashService.hash(otp),
      },
      this.otpTtlSeconds,
    );

    await this.sms.sendOtpTo(phoneNumber, otp);
  }

  async verify({ phoneNumber, ip, otp }: { phoneNumber: string; ip: string; otp: string }) {
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
      return {
        succeed: false,
        reason: 'exceeded_attempts',
        retryAfter: result.retryAfter,
      };
    }

    const record = await this.otps.get(phoneNumber);

    if (!record)
      return {
        succeed: false,
        reason: 'otp_not_found',
      };

    const valid = await this.hashService.verify(otp, record.hash);

    if (!valid) {
      return {
        succeed: false,
        reason: 'invalid_otp',
      };
    }

    await this.otps.delete(phoneNumber);

    const verifyToken = await this.tokenService.issue({
      type: 'verify',
      subject: phoneNumber,
      expiresIn: this.verifyTokenExpiresIn,
    });

    return {
      succeed: true,
      verifyToken,
    };
  }

  /**
   *
   */
  async signIn({ verifyToken }: { verifyToken: string }) {
    const payload = this.tokenService.decode(verifyToken);
    if (!payload) throw new Error();

    return await this.synchronizer.executeExclusive(
      `${AuthService.name}:sign-in:${payload.jti}`,
      async () => {
        const payload = await this.tokenService.verify(verifyToken, 'verify');
        if (!payload) throw new Error();

        // payload.sub is a phone number, because it comes from verify token
        const { customer } = await this.customers.findByPhoneNumber({ phoneNumber: payload.sub });

        const accessToken = await this.tokenService.issue({
          type: 'access',
          subject: customer.id,
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            principal: 'customer',
            customer: {
              id: customer.id,
              phoneNumber: customer.phoneNumber,
              type: customer.type,
            },
          } satisfies AuthClaims,
        });

        const refreshToken = await this.tokenService.issue({
          type: 'refresh',
          subject: customer.id,
          expiresIn: this.refreshTokenExpiresIn,
        });

        await this.tokenService.revoke(verifyToken, 'verify');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  async managerSignIn({ verifyToken, secretKey }: { verifyToken: string; secretKey: string }) {
    const payload = this.tokenService.decode(verifyToken);
    if (!payload) throw new Error();

    return await this.synchronizer.executeExclusive(
      `${AuthService.name}:manager-sign-in:${payload.jti}`,
      async () => {
        const payload = await this.tokenService.verify(verifyToken, 'verify');
        if (!payload) throw new Error();

        const { manager } = await this.manager.findByPhoneNumber({ phoneNumber: payload.sub });

        const verified = secretKey === this.config.managerSecretKey;
        if (!verified) throw new Error();

        const accessToken = await this.tokenService.issue({
          type: 'access',
          subject: manager.id,
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            principal: 'manager',
            manager: { id: manager.id },
          } satisfies AuthClaims,
        });

        const refreshToken = await this.tokenService.issue({
          type: 'refresh',
          subject: manager.id,
          expiresIn: this.refreshTokenExpiresIn,
        });

        await this.tokenService.revoke(verifyToken, 'verify');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  async adminSignIn({ verifyToken, secretKey }: { verifyToken: string; secretKey: string }) {
    const payload = this.tokenService.decode(verifyToken);
    if (!payload) throw new Error();

    return await this.synchronizer.executeExclusive(
      `${AuthService.name}:admin-sign-in:${payload.jti}`,
      async () => {
        const payload = await this.tokenService.verify(verifyToken, 'verify');
        if (!payload) throw new Error();

        const isAdmin = this.config.adminPhoneNumbers.includes(payload.sub);
        if (!isAdmin) throw new Error();

        const verified = secretKey === this.config.adminSecretKey;
        if (!verified) throw new Error();

        const accessToken = await this.tokenService.issue({
          type: 'access',
          subject: 'admin',
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            principal: 'admin',
          } satisfies AuthClaims,
        });

        const refreshToken = await this.tokenService.issue({
          type: 'refresh',
          subject: 'admin',
          expiresIn: this.refreshTokenExpiresIn,
        });

        await this.tokenService.revoke(verifyToken, 'verify');

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
  async signUp({ fullName, verifyToken }: { fullName: string; verifyToken: string }) {
    const payload = this.tokenService.decode(verifyToken);
    if (!payload) throw new Error();

    return this.synchronizer.executeExclusive(
      `${AuthService.name}:sign-up:${payload.jti}`,
      async () => {
        const payload = await this.tokenService.verify(verifyToken, 'verify');
        if (!payload) throw new Error();

        // payload.sub is a phone number, because it comes from verify token
        const { exists: customerExists } = await this.customers.existsByPhoneNumber({
          phoneNumber: payload.sub,
        });

        if (customerExists) throw new Error();

        const customerType: CustomerType = 'consumer';
        const { id: customerId } = await this.customers.create({
          type: customerType,
          fullName,
          phoneNumber: payload.sub,
        });

        const accessToken = await this.tokenService.issue({
          type: 'access',
          subject: customerId,
          expiresIn: this.accessTokenExpiresIn,
          claims: {
            principal: 'customer',
            customer: {
              id: customerId,
              phoneNumber: payload.sub,
              type: customerType,
            },
          } satisfies AuthClaims,
        });

        const refreshToken = await this.tokenService.issue({
          type: 'refresh',
          subject: customerId,
          expiresIn: this.refreshTokenExpiresIn,
        });

        await this.tokenService.revoke(verifyToken, 'verify');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }

  async refresh({ oldRefreshToken }: { oldRefreshToken: string }) {
    const payload = this.tokenService.decode(oldRefreshToken);
    if (!payload) throw new Error();

    return await this.synchronizer.executeExclusive(
      `${AuthService.name}:refresh:${payload.jti}`,
      async () => {
        const payload = (await this.tokenService.verify(oldRefreshToken, 'refresh')) as
          | (TokenPayload & AuthClaims)
          | null;
        if (!payload) throw new Error();

        let accessToken: string;
        let refreshToken: string;
        switch (payload.principal) {
          case 'admin':
            accessToken = await this.tokenService.issue({
              type: 'access',
              subject: 'admin',
              expiresIn: this.accessTokenExpiresIn,
              claims: {
                principal: 'admin',
              } satisfies AuthClaims,
            });

            refreshToken = await this.tokenService.issue({
              type: 'refresh',
              subject: 'admin',
              expiresIn: this.refreshTokenExpiresIn,
            });
            break;
          case 'manager':
            const { manager } = await this.manager.findById({
              managerId: payload.manager.id,
            });

            accessToken = await this.tokenService.issue({
              type: 'access',
              subject: 'manager',
              expiresIn: this.accessTokenExpiresIn,
              claims: {
                principal: 'manager',
                manager: { id: manager.id },
              } satisfies AuthClaims,
            });

            refreshToken = await this.tokenService.issue({
              type: 'refresh',
              subject: manager.id,
              expiresIn: this.refreshTokenExpiresIn,
            });
            break;
          default:
            // sub here is customer id, because it comes from refresh token
            const { customer } = await this.customers.findById({ customerId: payload.sub });

            accessToken = await this.tokenService.issue({
              type: 'access',
              subject: customer.id,
              expiresIn: this.accessTokenExpiresIn,
              claims: {
                principal: 'customer',
                customer: {
                  id: customer.id,
                  phoneNumber: customer.phoneNumber,
                  type: customer.type,
                },
              } satisfies AuthClaims,
            });

            refreshToken = await this.tokenService.issue({
              type: 'refresh',
              subject: customer.id,
              expiresIn: this.refreshTokenExpiresIn,
            });
        }

        await this.tokenService.revoke(oldRefreshToken, 'refresh');

        return {
          accessToken,
          refreshToken,
        };
      },
    );
  }
}
