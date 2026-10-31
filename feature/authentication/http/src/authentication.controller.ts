import { ProblemResponses } from '@feature/error-http/decorators';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { minutes, Throttle } from '@nestjs/throttler';
import authCfg from './authentication.config';
import {
  type AdminSignInDto,
  adminSignInSchema,
  type RefreshDto,
  refreshSchema,
  type RequestOtpDto,
  requestOtpSchema,
  type VerifyOtpDto,
  verifyOtpSchema,
} from './authentication.dto';
import {
  AUTH_ERROR_MAPPINGS,
  OTP_ERROR_MAPPINGS,
} from './authentication.errors';
import { AdminSecretSignInCommand } from './commands/admin-secret-sing-in.command';
import { OtpVerifyCommand } from './commands/opt-verify.command';
import { OtpRequestCommand } from './commands/otp-request.command';
import { OtpSignInCommand } from './commands/otp-sign-in.command';
import { RefreshCommand } from './commands/refresh.command';
import { Public } from './decorators';

@Public()
@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly otpRequestCmd: OtpRequestCommand,
    private readonly otpVerifyCmd: OtpVerifyCommand,
    private readonly otpSigInCmd: OtpSignInCommand,
    private readonly adminSecretSingInCmd: AdminSecretSignInCommand,
    private readonly refreshCmd: RefreshCommand,
    @Inject(authCfg.KEY) private readonly cfg: ConfigType<typeof authCfg>,
  ) {}

  // ---------- OTP ----------

  @Throttle({
    auth: { limit: 3, ttl: minutes(10), blockDuration: minutes(10) },
  })
  @Post('otp/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestOtp(@Body({ schema: requestOtpSchema }) dto: RequestOtpDto) {
    return this.otpRequestCmd.execute(dto);
  }

  /** Useful for password sign-in */
  @ProblemResponses(
    ...OTP_ERROR_MAPPINGS,
    AUTH_ERROR_MAPPINGS.AuthTokenInvalidError,
  )
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.otpVerifyCmd.execute(dto);
  }

  // ---------- Customer ----------

  @ProblemResponses(
    ...OTP_ERROR_MAPPINGS,
    AUTH_ERROR_MAPPINGS.AuthTokenInvalidError,
  )
  @Post('customer/sign-in')
  @HttpCode(HttpStatus.OK)
  @HttpCode(HttpStatus.OK)
  async signInCustomer(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.otpSigInCmd.execute({ ...dto, role: 'customer' });
  }

  // ---------- Staff ----------

  @ProblemResponses(
    ...OTP_ERROR_MAPPINGS,
    AUTH_ERROR_MAPPINGS.AuthTokenInvalidError,
  )
  @Post('courier/sign-in')
  @HttpCode(HttpStatus.OK)
  singInCourier(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.otpSigInCmd.execute({ ...dto, role: 'courier' });
  }

  @ProblemResponses(
    ...OTP_ERROR_MAPPINGS,
    AUTH_ERROR_MAPPINGS.AuthTokenInvalidError,
  )
  @Post('manager/sign-in')
  @HttpCode(HttpStatus.OK)
  signInManager(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.otpSigInCmd.execute({ ...dto, role: 'manager' });
  }

  @ProblemResponses(...AUTH_ERROR_MAPPINGS)
  @Throttle({
    auth: { limit: 3, ttl: minutes(10) },
  })
  @Post('admin/sign-in')
  @HttpCode(HttpStatus.OK)
  signInAdmin(@Body({ schema: adminSignInSchema }) dto: AdminSignInDto) {
    return this.adminSecretSingInCmd.execute(dto);
  }

  // ---------- Tokens ----------

  @ProblemResponses(AUTH_ERROR_MAPPINGS.AuthTokenInvalidError)
  @Throttle({
    auth: { limit: 3, ttl: minutes(10) },
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body({ schema: refreshSchema }) dto: RefreshDto) {
    return this.refreshCmd.execute(dto);
  }
}
