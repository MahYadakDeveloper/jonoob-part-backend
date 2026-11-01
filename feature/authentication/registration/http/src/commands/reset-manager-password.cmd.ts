import { Command } from '@feature/shared/cqrs';
import { assertOne } from '@feature/shared/utils/assertions';
import { BunPasswordHasher } from '@infra/crypto/password-hasher';
import { InjectDrizzle, type Database } from '@infra/db-drizzle';
import { managersPasswords } from '@infra/schema/actors/managers.schema';
import { eq } from 'drizzle-orm';

interface ResetManagerPasswordInput {
  managerId: string;
  password: string;
}

export class ResetManagerPasswordCommand implements Command<ResetManagerPasswordInput> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
    private readonly hasher: BunPasswordHasher,
  ) {}
  async execute({
    managerId,
    password,
  }: ResetManagerPasswordInput): Promise<void> {
    const hashedPassword = await this.hasher.hash(password);

    const updated = await this.db
      .update(managersPasswords)
      .set({ hashedPassword })
      .where(eq(managersPasswords.managerId, managerId))
      .returning({ id: managersPasswords.managerId });

    assertOne(updated, Error);
  }
}
