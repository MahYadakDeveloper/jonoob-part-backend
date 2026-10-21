import { Manager } from './manager.type';

export const MANAGER_API = Symbol('MANAGER_API');
export interface ManagerApi {
  getById(managerId: string): Promise<Manager>;
  getByPhone(phone: string): Promise<Manager>;
}
