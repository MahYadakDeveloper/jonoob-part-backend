import { DrizzleBaseRepository } from '@infra/db-drizzle';

export class UserRepository extends DrizzleBaseRepository {
  findOrCreateAdminByPhoneAndReturnId(phone: string): Promise<string> {}

  findOrCreateCustomerByPhoneAndReturnId(phone: string): Promise<string> {}

  getManagerIdByPhone(phone: string): Promise<string> {}
  getCourierIdByPhone(phone: string): Promise<string> {}
}
