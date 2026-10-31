import { DrizzleBaseRepository } from '@infra/db-drizzle';

export class UserRepository extends DrizzleBaseRepository {
  findOrCreateAdminByPhone() {}

  findOrCreateCustomerByPhone(phone: string): { customerId: string } {}

  getManagerByPhone() {}
  getCourierByPhone() {}
}
