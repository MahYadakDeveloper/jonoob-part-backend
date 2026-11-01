import { Command } from '@feature/shared/cqrs';
import { assertOne, ensureOne } from '@feature/shared/utils/assertions';
import { BunPasswordHasher } from '@infra/crypto/password-hasher';
import { generatePassword } from '@infra/crypto/random';
import { InjectDrizzle, type Database } from '@infra/db-drizzle';
import { BullmqSms } from '@infra/messaging-sms';
import {
  managersPasswords,
  managersPhones,
} from '@infra/schema/actors/managers.schema';
import { eq } from 'drizzle-orm';
import { ManagerPasswordSmsPayload } from '@feature/authentication-sms/sms-manager-password.template';

interface ResetManagerPasswordByAdminInput {
  managerId: string;
}

export class ResetManagerPasswordByAdminCommand implements Command<ResetManagerPasswordByAdminInput> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
    private readonly hasher: BunPasswordHasher,
    private readonly sms: BullmqSms,
  ) {}
  async execute({
    managerId,
  }: ResetManagerPasswordByAdminInput): Promise<void> {
    const password = generatePassword(8);

    const { phone } = ensureOne(
      await this.db
        .select({ phone: managersPhones.phone })
        .from(managersPhones)
        .where(eq(managersPhones.managerId, managerId)),
      Error,
    );

    await this.sms.enqueue({
      to: phone,
      data: { password },
      template: 'auth.manager-password',
    } satisfies ManagerPasswordSmsPayload);

    const hashedPassword = await this.hasher.hash(password);

    const updated = await this.db
      .update(managersPasswords)
      .set({ hashedPassword })
      .where(eq(managersPasswords.managerId, managerId))
      .returning({ id: managersPasswords.managerId });

    assertOne(updated, Error);
  }
}
