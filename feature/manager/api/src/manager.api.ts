import { Manager } from './manager.type';

export interface ManagerApi {
  findById(req: { managerId: string }): Promise<{ manager: Manager }>;
  findByPhoneNumber(req: { phoneNumber: string }): Promise<{ manager: Manager }>;
}
