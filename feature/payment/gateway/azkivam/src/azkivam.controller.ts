import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { type FastifyReply } from 'fastify';
import { AzkivamGateway } from './azkivam.gateway';

@Controller('/payment/azkivam')
export class AzkivamCallbackController {
  constructor(private readonly gateway: AzkivamGateway) {}
  @Get('callback')
  async callbackGet(@Query('providerId') providerId: number, @Res() res: FastifyReply) {
    this.gateway.verifyPayment();
    res.redirect('[TODO]', 302);
  }

  @Post('callback')
  async callbackPost(@Query('providerId') providerId: number, @Res() res: FastifyReply) {
    res.redirect('[TODO]', 302);
  }
}
