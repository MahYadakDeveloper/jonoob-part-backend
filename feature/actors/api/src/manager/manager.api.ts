import { Manager } from './manager.type';

export const MANAGER_API = Symbol('ManagerApi');
export interface ManagerApi {
  findById(managerId: string): Promise<Manager>;
  findByPhone(phone: string): Promise<Manager>;
}
