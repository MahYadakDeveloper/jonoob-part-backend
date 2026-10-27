import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
// [ASSUMPTION] adjust the token name to whatever you export next to the API
import {
  type AdminSignInDto,
  adminSignInSchema,
  type HashRequestDto,
  hashRequestSchema,
  type PasswordSignInDto,
  passwordSignInSchema,
  type RefreshDto,
  refreshSchema,
  type RequestOtpDto,
  requestOtpSchema,
  type SignUpDto,
  signUpSchema,
  type VerifyOtpDto,
  verifyOtpSchema,
  type VerifyTokenDto,
  verifyTokenSchema,
} from './auth.dto';
import { AuthenticationService } from './auth.service';

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
    @Body({ schema: requestOtpSchema }) dto: RequestOtpDto,
    @Ip() ip: string,
  ) {
    await this.auth.request(dto.phoneNumber, ip);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto,
    @Ip() ip: string,
  ) {
    return this.auth.verify({
      phoneNumber: dto.phoneNumber,
      otp: dto.otp,
      ip,
    });
  }

  // ---------- Customer ----------

  @Post('customer/sign-in')
  @HttpCode(HttpStatus.OK)
  customerSignIn(@Body({ schema: verifyTokenSchema }) dto: VerifyTokenDto) {
    return this.auth.signIn({ verifyToken: dto.verifyToken });
  }

  @Post('customer/sign-up')
  @HttpCode(HttpStatus.CREATED)
  customerSignUp(@Body({ schema: signUpSchema }) dto: SignUpDto) {
    return this.auth.signUp({
      verifyToken: dto.verifyToken,
      fullName: dto.fullName,
    });
  }

  // ---------- Staff ----------

  @Post('courier/sign-in')
  @HttpCode(HttpStatus.OK)
  courierSignIn(
    @Body({ schema: passwordSignInSchema }) dto: PasswordSignInDto,
  ) {
    return this.auth.courierSingIn({
      verifyToken: dto.verifyToken,
      password: dto.password,
    });
  }

  @Post('manager/sign-in')
  @HttpCode(HttpStatus.OK)
  managerSignIn(
    @Body({ schema: passwordSignInSchema }) dto: PasswordSignInDto,
  ) {
    return this.auth.managerSignIn({
      verifyToken: dto.verifyToken,
      password: dto.password,
    });
  }

  @Post('admin/sign-in')
  @HttpCode(HttpStatus.OK)
  adminSignIn(@Body({ schema: adminSignInSchema }) dto: AdminSignInDto) {
    return this.auth.adminSignIn({
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

  // --------- hashing --------
  @Post('hash')
  @HttpCode(HttpStatus.OK)
  hash(@Body({ schema: hashRequestSchema }) dto: HashRequestDto) {
    return this.auth.hash(dto);
  }
}
