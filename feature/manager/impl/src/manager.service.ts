import { Manager, ManagerApi } from '@feature/manager-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ManagerService implements ManagerApi {
  constructor() {}

  findById(req: { managerId: string }): Promise<{
    manager: Manager;
  }> {
    throw new Error('Method not implemented.');
  }

  findByPhoneNumber(req: { phoneNumber: string }): Promise<{
    manager: Manager;
  }> {
    throw new Error('Method not implemented.');
  }

  /**
   * [NOTE]
   * Admin only access.
   */
  create({ data }: { data: Omit<Manager, 'id'> }) {}
}
