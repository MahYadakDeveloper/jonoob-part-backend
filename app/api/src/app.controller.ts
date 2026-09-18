/// <reference types="@fastify/multipart" />
import { Controller, Get, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Req() req: FastifyRequest) {
    req.file();
    return this.appService.getHello();
  }
}
