export interface Manager {
  id: string;
  fullName: string;
  phone: string;
  hashedPassword: string;
}

export interface GetManagerByIdInput {
  managerId: string;
}

export interface GetManagerByPhoneInput {
  phone: string;
}

export interface FindOrCreateAdminInput {
  // TODO design by existing schemas
}

export const MANAGER_API = Symbol('MANAGER_API');
export interface ManagerApi {
  findOrCreateAdmin(input: FindOrCreateAdminInput): Promise<Manager>;
  getById(input: GetManagerByIdInput): Promise<Manager>;
  getByPhone(input: GetManagerByPhoneInput): Promise<Manager>;
}
