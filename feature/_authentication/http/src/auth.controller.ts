import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
// [ASSUMPTION] adjust the token name to whatever you export next to the API
import { minutes, Throttle } from '@nestjs/throttler';
import {
  type AdminSignInDto,
  adminSignInSchema,
  type PasswordSignInDto,
  passwordSignInSchema,
  type RefreshDto,
  refreshSchema,
  type RequestOtpDto,
  requestOtpSchema,
  type VerifyOtpDto,
  verifyOtpSchema,
} from './auth.dto';
import { AuthenticationService } from './auth.service';
import { Public } from './decorators';

/**
 * App-layer controller: depends only on the feature :api contract.
 *
 * Flow:
 *
 * 1. POST /auth/otp/request -> SMS with OTP
 * 2. POST /auth/otp/verify -> ({ verifyToken } (single-use, 5 min) for admin) ({accessToken, refreshToken} customer -
 *    manager -courier)
 * 3. verifyToken is exchanged by exactly one of admin/sign-in
 * 4. POST /auth/refresh -> rotates the token pair
 *
 * All routes are public: exclude them from the global auth guard (e.g. with your @Public() decorator).
 */
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthenticationService) {}

  // ---------- OTP ----------

  @Throttle({
    auth: { limit: 3, ttl: minutes(10), blockDuration: minutes(10) },
  })
  @Post('otp/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestOtp(@Body({ schema: requestOtpSchema }) dto: RequestOtpDto) {
    await this.auth.request(dto.phone);
  }

  // For admin auth
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.auth.verify({
      // phoneNumber: dto.phoneNumber,
      // TODO Use token instead, when otp is requested return token for verify
      otp: dto.otp,
      ip,
    });
  }

  // ---------- Customer ----------

  @Post('customer/sign-in')
  @HttpCode(HttpStatus.OK)
  @HttpCode(HttpStatus.OK)
  async signInCustomer(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.auth.signInCustomer(dto);
  }

  // ---------- Staff ----------

  @Post('courier/sign-in')
  @HttpCode(HttpStatus.OK)
  singInCourier(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.auth.signInCourier(dto);
  }

  @Post('manager/sign-in')
  @HttpCode(HttpStatus.OK)
  signInManager(
    @Body({ schema: passwordSignInSchema }) dto: PasswordSignInDto,
  ) {
    return this.auth.managerSignIn({
      verifyToken: dto.verifyToken,
      password: dto.password,
    });
  }

  @Post('admin/sign-in')
  @HttpCode(HttpStatus.OK)
  signInAdmin(@Body({ schema: adminSignInSchema }) dto: AdminSignInDto) {
    return this.auth.signInAdmin({
      verifyToken: dto.verifyToken,
      secretKey: dto.secretKey,
    });
  }

  // ---------- Tokens ----------

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body({ schema: refreshSchema }) dto: RefreshDto) {
    return this.auth.refresh({ oldRefreshToken: dto.refreshToken });
  }
}
