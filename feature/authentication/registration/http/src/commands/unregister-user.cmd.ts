import { Command } from '@feature/shared/cqrs';
import { assertNever, assertOne } from '@feature/shared/utils/assertions';
import { type Database, InjectDrizzle } from '@infra/db-drizzle';
import { couriers } from '@infra/schema/actors/couriers.schema';
import { managers } from '@infra/schema/actors/managers.schema';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

export type UnregisterUserInput = {
  id: string;
  usr: 'manager' | 'courier';
};

@Injectable()
export class UnregisterUserCommand implements Command<
  UnregisterUserInput,
  void
> {
  constructor(
    @InjectDrizzle()
    private readonly db: Database,
  ) {}

  async execute({ id, usr }: UnregisterUserInput): Promise<void> {
    let deleted;
    switch (usr) {
      case 'manager':
        deleted = await this.db
          .delete(managers)
          .where(eq(managers.id, id))
          .returning({ id: managers.id });
        break;
      case 'courier':
        deleted = await this.db
          .delete(couriers)
          .where(eq(couriers.id, id))
          .returning({ id: couriers.id });
        break;
      default:
        assertNever(usr);
    }

    assertOne(deleted, Error);
  }
}
