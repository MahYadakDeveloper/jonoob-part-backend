import { appConfig } from '@infra/config';
import { Controller, Get, Inject, ParseIntPipe, Post, Query, Res } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { type FastifyReply } from 'fastify';
import { AzkivamGateway } from './azkivam.gateway';

@Controller('/payment/azkivam')
export class AzkivamCallbackController {
  constructor(
    private readonly gateway: AzkivamGateway,
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
  ) {}
  @Get('callback')
  async callbackGet(
    @Query('providerId', ParseIntPipe) providerId: number,
    @Res() res: FastifyReply,
  ) {
    const { status } = await this.gateway.verifyPaymentTicket({ providerId });
    if (status === 'verified') return res.redirect(this.app.successfulPaymentUrl, 302);

    return res.redirect(`${this.app.failurePaymentUrl}?status=${status}`, 302);
  }

  @Post('callback')
  async callbackPost(
    @Query('providerId', ParseIntPipe) providerId: number,
    @Res() res: FastifyReply,
  ) {
    const { status } = await this.gateway.verifyPaymentTicket({ providerId });
    if (status === 'verified') return res.redirect(this.app.successfulPaymentUrl, 302);

    return res.redirect(`${this.app.failurePaymentUrl}?status=${status}`, 302);
  }
}
