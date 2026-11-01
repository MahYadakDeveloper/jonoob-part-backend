import {
  CourierConflictError,
  MalformedPhoneNumberError,
} from '@feature/authentication-errors';
import { Command } from '@feature/shared/cqrs';

import {
  type Database,
  DbErrors,
  InjectDrizzle,
  onUq,
} from '@infra/db-drizzle';
import { couriers } from '@infra/schema/actors/couriers.schema';
import { Injectable } from '@nestjs/common';

export type RegisterCourierInput = {
  phone: string;
  nickname: string;
};

@DbErrors({
  constraints: {
    ...onUq(couriers, 'nickname', () => new CourierConflictError('nickname')),
    ...onUq(couriers, 'phone', () => new CourierConflictError('phone')),
    PHONE_FORMAT_CHECK: MalformedPhoneNumberError,
  },
})
@Injectable()
export class RegisterCourierCommand implements Command<
  RegisterCourierInput,
  void
> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
  ) {}

  async execute(input: RegisterCourierInput): Promise<void> {
    await this.db.insert(couriers).values(input);
  }
}
