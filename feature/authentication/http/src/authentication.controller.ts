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
import { OtpVerifyCommand } from './commands/opt-verify.command';
import { OtpRequestCommand } from './commands/otp-request.command';
import { OtpSignInCourierCommand } from './commands/otp-sign-in-courier.command';
import { OtpSignInCustomerCommand } from './commands/otp-sign-in-customer.command';
import { OtpSignInManagerCommand } from './commands/otp-sign-in-manager.command';
import { Public } from './decorators';

@Public()
@Controller('auth')
export class AuthenticationController {
  constructor(
    private readonly otpRequestCmd: OtpRequestCommand,
    private readonly otpVerifyCmd: OtpVerifyCommand,
    private readonly otpSingInManagerCmd: OtpSignInManagerCommand,
    private readonly otpSingInCourierCmd: OtpSignInCourierCommand,
    private readonly otpSingInCustomerCmd: OtpSignInCustomerCommand,
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
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.otpVerifyCmd.execute(dto);
  }

  // ---------- Customer ----------

  @Post('customer/sign-in')
  @HttpCode(HttpStatus.OK)
  @HttpCode(HttpStatus.OK)
  async signInCustomer(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.otpSingInCustomerCmd.execute(dto);
  }

  // ---------- Staff ----------

  @Post('courier/sign-in')
  @HttpCode(HttpStatus.OK)
  singInCourier(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.otpSingInCourierCmd.execute(dto);
  }

  @Post('manager/sign-in')
  @HttpCode(HttpStatus.OK)
  signInManager(@Body({ schema: verifyOtpSchema }) dto: VerifyOtpDto) {
    return this.otpSingInManagerCmd.execute(dto);
  }

  @Throttle({
    auth: { limit: 3, ttl: minutes(10) },
  })
  @Post('admin/sign-in')
  @HttpCode(HttpStatus.OK)
  signInAdmin(@Body({ schema: adminSignInSchema }) dto: AdminSignInDto) {
    return this.auth.signInAdmin({
      verifyToken: dto.verifyToken,
      secretKey: dto.secretKey,
    });
  }

  // ---------- Tokens ----------

  @Throttle({
    auth: { limit: 3, ttl: minutes(10) },
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body({ schema: refreshSchema }) dto: RefreshDto) {
    return this..refresh({ oldRefreshToken: dto.refreshToken });
  }
}
