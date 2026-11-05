import { ensureFirst, ensureOne } from '@feature/shared/utils/assertions';
import { DrizzleBaseRepository } from '@infra/db-drizzle';
import { couriers } from '@infra/schema/actors/couriers.schema';
import { customers } from '@infra/schema/actors/customers.schema';
import {
  managers,
  managersPasswords,
  managersPhones,
} from '@infra/schema/actors/managers.schema';
import { eq } from 'drizzle-orm';

export class UserRepository extends DrizzleBaseRepository {
  async findOrCreateAdminByPhoneAndReturnId(phone: string): Promise<string> {
    return this.db.transaction(async (tx) => {
      const [admin] = await tx
        .select({ id: managersPhones.managerId })
        .from(managersPhones)
        .where(eq(managersPhones.phone, phone));

      if (admin?.id) return admin.id;

      const [inserted] = await tx
        .insert(managers)
        .values({ nickName: `admin-[${phone}]` })
        .returning({ id: managers.id });

      await tx
        .insert(managersPhones)
        .values({ managerId: inserted!.id, phone });

      return inserted!.id;
    });
  }

  findOrCreateConsumerCustomerTypeByPhoneAndReturnId(
    phone: string,
  ): Promise<string> {
    return this.db.transaction(async (tx) => {
      const [customer] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.phone, phone));

      if (customer) return customer.id;

      const [inserted] = await tx
        .insert(customers)
        .values({ phone, type: 'consumer' })
        .returning({ id: customers.id });

      return inserted!.id;
    });
  }

  async getManagerByPhone(phone: string) {
    const managerId = await this.db
      .select({ managerId: managersPhones.managerId })
      .from(managersPhones)
      .where(eq(managersPhones.phone, phone))
      .then((rows) => ensureFirst(rows, Error).managerId);

    const passwords = await this.db
      .select({ hashedPassword: managersPasswords.hashedPassword })
      .from(managersPasswords)
      .where(eq(managersPasswords.managerId, managerId));

    return {
      id: managerId,
      hashedPassword: ensureOne(passwords, Error).hashedPassword,
    };
  }

  getCourierIdByPhone(phone: string): Promise<string> {
    return this.db
      .select({ courierId: couriers.id })
      .from(couriers)
      .where(eq(couriers.phone, phone))
      .then((rows) => ensureFirst(rows, Error).courierId);
  }
}
