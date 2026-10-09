import { Courier as CourierDto } from '@feature/actors-api/courier';
import { type OtpGenerator, type OutboxRepository } from '@feature/common';
import { Injectable } from '@nestjs/common';
import { Courier, type CourierRepository } from './courier.repository';

@Injectable()
export class CourierService {
  constructor(
    private readonly repository: CourierRepository,
    private readonly otp: OtpGenerator,
    private readonly outbox: OutboxRepository,
  ) {}

  toDto({ deliveries, phone, ...rest }: Courier): CourierDto {
    return {
      ...rest,
      phoneNumber: phone,
    };
  }
}
