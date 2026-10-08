import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {
  constructor(private readonly http: HttpService) {}

  send(to: string, template: string, ...vars: string[]) {}
}
