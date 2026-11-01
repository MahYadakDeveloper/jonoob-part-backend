import { Command } from '@feature/shared/cqrs';
import { generatePassword } from '@infra/crypto/random';

import {
  MalformedPhoneNumberError,
  ManagerConflictError,
} from '@feature/authentication-errors';
import { ManagerPasswordSmsPayload } from '@feature/authentication-sms/sms-manager-password.template';
import { BunPasswordHasher } from '@infra/crypto/password-hasher';
import {
  type Database,
  DbErrors,
  InjectDrizzle,
  onUq,
} from '@infra/db-drizzle';
import { BullmqSms } from '@infra/messaging-sms';
import {
  managers,
  managersPasswords,
  managersPhones,
} from '@infra/schema/actors/managers.schema';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

export type RegisterManagerInput = {
  phone: string;
  nickname: string;
};

@DbErrors({
  constraints: {
    ...onUq(managers, 'nickname', () => new ManagerConflictError('nickname')),
    ...onUq(managersPhones, 'phone', () => new ManagerConflictError('phone')),
    PHONE_FORMAT_CHECK: MalformedPhoneNumberError,
  },
})
@Injectable()
export class RegisterManagerCommand implements Command<
  RegisterManagerInput,
  void
> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
    private readonly hasher: BunPasswordHasher,
    private readonly sms: BullmqSms,
  ) {}

  async execute({ nickname, phone }: RegisterManagerInput): Promise<void> {
    const password = generatePassword(8);

    const hashedPassword = await this.hasher.hash(password);

    await this.sms.enqueue({
      to: phone,
      data: { password },
      template: 'auth.manager-password',
    } satisfies ManagerPasswordSmsPayload);

    const [existing] = await this.db
      .select()
      .from(managersPhones)
      .where(eq(managersPhones.phone, phone));
    if (existing) throw new Error();

    const [inserted] = await this.db
      .insert(managers)
      .values({ nickname: nickname })
      .returning({ id: managers.id });

    await this.db
      .insert(managersPhones)
      .values({ managerId: inserted!.id, phone: phone });
    await this.db
      .insert(managersPasswords)
      .values({ managerId: inserted!.id, hashedPassword });
  }
}
