import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Ip,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
// [ASSUMPTION] adjust the token name to whatever you export next to the API
import {
  type AdminSignInDto,
  AdminSignInSchema,
  type PasswordSignInDto,
  PasswordSignInSchema,
  type RefreshDto,
  RefreshSchema,
  type RequestOtpDto,
  RequestOtpSchema,
  type SignUpDto,
  SignUpSchema,
  type VerifyOtpDto,
  VerifyOtpSchema,
  type VerifyTokenDto,
  VerifyTokenSchema,
} from './auth.dto';
import { AuthenticationService } from './auth.service';

type Failure = {
  succeed: false;
  reason: string;
  retryAfter?: number;
  reachedLimit?: string;
};

/**
 * App-layer controller: depends only on the feature :api contract.
 *
 * Flow:
 *   1. POST /auth/otp/request   -> SMS with OTP
 *   2. POST /auth/otp/verify    -> { verifyToken }   (single-use, 5 min)
 *   3. verifyToken is exchanged by exactly one of:
 *        customer/sign-in | customer/sign-up | courier/sign-in |
 *        manager/sign-in  | admin/sign-in
 *   4. POST /auth/refresh       -> rotates the token pair
 *
 * All routes are public: exclude them from the global auth guard
 * (e.g. with your @Public() decorator).
 */
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly auth: AuthenticationService) {}

  // ---------- OTP ----------

  @Post('otp/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestOtp(
    @Body({ schema: RequestOtpSchema }) dto: RequestOtpDto,
    @Ip() ip: string,
  ) {
    const result = (await this.auth.request(dto.phoneNumber, ip)) as
      | Failure
      | { succeed: true }
      | undefined;

    // service returns undefined on success today
    if (result && !result.succeed) throw this.toHttpError(result);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body({ schema: VerifyOtpSchema }) dto: VerifyOtpDto,
    @Ip() ip: string,
  ) {
    const result = (await this.auth.verify({
      phoneNumber: dto.phoneNumber,
      otp: dto.otp,
      ip,
    })) as Failure | { succeed: true; verifyToken: string };

    if (!result.succeed) throw this.toHttpError(result);
    return { verifyToken: result.verifyToken };
  }

  // ---------- Customer ----------

  @Post('customer/sign-in')
  @HttpCode(HttpStatus.OK)
  customerSignIn(@Body({ schema: VerifyTokenSchema }) dto: VerifyTokenDto) {
    return this.auth.signIn({ verifyToken: dto.verifyToken });
  }

  @Post('customer/sign-up')
  @HttpCode(HttpStatus.CREATED)
  customerSignUp(@Body({ schema: SignUpSchema }) dto: SignUpDto) {
    return this.auth.signUp({
      verifyToken: dto.verifyToken,
      fullName: dto.fullName,
    });
  }

  // ---------- Staff ----------

  @Post('courier/sign-in')
  @HttpCode(HttpStatus.OK)
  courierSignIn(
    @Body({ schema: PasswordSignInSchema }) dto: PasswordSignInDto,
  ) {
    return this.auth.courierSingIn({
      verifyToken: dto.verifyToken,
      password: dto.password,
    });
  }

  @Post('manager/sign-in')
  @HttpCode(HttpStatus.OK)
  managerSignIn(
    @Body({ schema: PasswordSignInSchema }) dto: PasswordSignInDto,
  ) {
    return this.auth.managerSignIn({
      verifyToken: dto.verifyToken,
      password: dto.password,
    });
  }

  @Post('admin/sign-in')
  @HttpCode(HttpStatus.OK)
  adminSignIn(@Body({ schema: AdminSignInSchema }) dto: AdminSignInDto) {
    return this.auth.adminSignIn({
      verifyToken: dto.verifyToken,
      secretKey: dto.secretKey,
    });
  }

  // ---------- Tokens ----------

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body({ schema: RefreshSchema }) dto: RefreshDto) {
    return this.auth.refresh({ oldRefreshToken: dto.refreshToken });
  }

  // ---------- Error mapping ----------

  private toHttpError(failure: Failure): HttpException {
    switch (failure.reason) {
      case 'exceeded_attempts':
      case 'reached_limit':
        return new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            reason: failure.reason,
            retryAfter: failure.retryAfter, // seconds
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      case 'otp_not_found':
        return new BadRequestException({ reason: failure.reason });
      case 'invalid_otp':
        return new UnauthorizedException({ reason: failure.reason });
      default:
        return new BadRequestException({ reason: failure.reason });
    }
  }
}
