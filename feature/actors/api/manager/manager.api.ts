import { Manager } from './manager.type';

export const MANAGER_API = Symbol('ManagerApi');
export interface ManagerApi {
  findById(req: { managerId: string }): Promise<{ manager: Manager }>;
  findByPhoneNumber(req: {
    phoneNumber: string;
  }): Promise<{ manager: Manager }>;
}
