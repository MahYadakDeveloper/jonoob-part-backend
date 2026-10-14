import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  constructor(private readonly http: HttpService) {}

  send(to: string, template: string, ...vars: string[]) {
    this.logger.log('sending...:', { to, template, vars });
  }
}
