import { Injectable, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
