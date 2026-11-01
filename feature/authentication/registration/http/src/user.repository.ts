import {
  CourierConflictError,
  MalformedPhoneNumberError,
  ManagerConflictError,
} from '@feature/authentication-errors';
import { DbErrors, DrizzleBaseRepository, onUq } from '@infra/db-drizzle';
import { couriers } from '@infra/schema/actors/couriers.schema';
import {
  managers,
  managersPasswords,
  managersPhones,
} from '@infra/schema/actors/managers.schema';
import { eq } from 'drizzle-orm';

@DbErrors({
  constraints: {
    ...onUq(managers, 'nickname', () => new ManagerConflictError('nickname')),
    ...onUq(managersPhones, 'phone', () => new ManagerConflictError('phone')),
    ...onUq(couriers, 'nickname', () => new CourierConflictError('nickname')),
    ...onUq(couriers, 'phone', () => new CourierConflictError('phone')),
    PHONE_FORMAT_CHECK: MalformedPhoneNumberError,
  },
})
export class UserRepository extends DrizzleBaseRepository {
  async createManager(data: {
    nickname: string;
    phone: string;
    hashedPassword: string;
  }) {}

  async updateManagerPassword(
    managerId: string,
    hashedPassword: string,
  ): Promise<boolean> {}

  async createCourier(data: { nickname: string; phone: string }) {}

  async deleteManager(managerId: string) {}
  async deleteCourier(courierId: string) {
    await this.db.delete(couriers).where(eq(couriers.id, courierId));
  }
}
