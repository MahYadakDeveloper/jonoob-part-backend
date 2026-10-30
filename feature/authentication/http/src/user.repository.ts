import { DrizzleBaseRepository } from '@infra/db-drizzle';

export class UserRepository extends DrizzleBaseRepository {
  findOrCreateAdminUser() {}

  findOrCreateCustomerUser() {}

  findManagerUser() {}
  findCourierUser() {}
}
