import { type HashService } from '@feature/auth-hashing';
import { type RateLimitService, TokenBucketConfig } from '@feature/auth-rate-limit';
import { type SmsService } from '@feature/auth-sms';
import { type TokenService } from '@feature/auth-token';
import { CustomerType, type OtpGenerator, type Synchronizer } from '@feature/common';
import { type CustomersApi } from '@feature/customer-api';
import { Injectable } from '@nestjs/common';
import { AuthClaimsType } from './auth.types';
import { type OtpStore } from './port/otp.store';
import { type TokenStore } from './port/token.store';

/**
 * [NOTE]
 * For opt store implementation use redis
 *
 * [NOTE]
 * Flow of singUp/singIn:
 * - client app need to check customer is already singed up:
 *  # [already singed up]:
 *    - request otp
 *    - sing in
 *  # [required to sing up]:
 *    - gets required data from user (fullName)
 *    - then request otp
 *    - sing in
 * - then customer has would achieve a token
 */
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
  private readonly verificationExpiresIn = 300; // 5 min

  constructor(
    private readonly customers: CustomersApi,
    private readonly otps: OtpStore,
    private readonly tokenService: TokenService,
    private readonly tokens: TokenStore,
    private readonly hashService: HashService,
    private readonly rateLimit: RateLimitService,
    private readonly sms: SmsService,
    private readonly otpGenerator: OtpGenerator,
    private readonly synchronizer: Synchronizer,
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
      `verification:${phoneNumber}`,
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

    const { token: verifyToken, jti } = await this.tokenService.issue({
      type: 'verification',
      subject: phoneNumber,
      expiresIn: this.verificationExpiresIn,
    });

    await this.tokens.set(jti, this.verificationExpiresIn);

    return {
      succeed: true,
      verifyToken,
    };
  }

  /**
   *
   */
  async signIn({ verifyToken }: { verifyToken: string }) {
    const payload = await this.tokenService.verify(verifyToken, 'verification');
    if (!payload) throw new Error();

    await this.tokens.consume(payload.jti);

    // [NOTE] if customer not found it would throw an error
    const { customer } = await this.customers.findByPhoneNumber({ phoneNumber: payload.sub });

    const { token: accessToken } = await this.tokenService.issue({
      type: 'access',
      subject: customer.id,
      claims: {
        customer: {
          id: customer.id,
          phoneNumber: customer.phoneNumber,
          type: customer.type,
        },
      } satisfies AuthClaimsType,
    });

    return {
      accessToken,
    };
  }

  /**
   *
   */
  async signUp({ fullName, verifyToken }: { fullName: string; verifyToken: string }) {
    const payload = await this.tokenService.verify(verifyToken, 'verification');
    if (!payload) throw new Error();

    return this.synchronizer.executeExclusive(
      `${AuthService.name}:sign-up:${payload.sub}`,
      async () => {
        await this.tokens.consume(payload.jti);

        const { exists } = await this.customers.existsByPhoneNumber({ phoneNumber: payload.sub });
        if (exists) throw new Error();

        const customerType: CustomerType = 'consumer';
        const { id: customerId } = await this.customers.create({
          type: customerType,
          fullName,
          phoneNumber: payload.sub,
        });

        const { token: accessToken } = await this.tokenService.issue({
          type: 'access',
          subject: customerId,
          claims: {
            customer: {
              id: customerId,
              phoneNumber: payload.sub,
              type: customerType,
            },
          },
        });

        return {
          accessToken,
        };
      },
    );
  }

  /**
   * Generate new token
   *
   * [NOTE]
   * Useful for client side app that if customer is active and app
   * check if token is n hours left to expire then app can refresh
   */
  refresh() {}
}
