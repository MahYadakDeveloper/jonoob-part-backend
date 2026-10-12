import { Manager, ManagerApi } from '@feature/actors-api/manager';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ManagerRepository } from './manager.repository';

@Injectable()
export class ManagerService implements ManagerApi {
  constructor(private readonly repository: ManagerRepository) {}

  findById(managerId: string): Promise<Manager> {
    return this.repository.findById(managerId).then((m) => {
      if (!m) throw new NotFoundException(`Manager ${managerId} not found`);
      return m;
    });
  }

  findByPhone(phone: string): Promise<Manager> {
    return this.repository.findByPhone(phone).then((m) => {
      if (!m)
        throw new NotFoundException(`Manager not found with ${phone} number`);
      return m;
    });
  }

  /**
   * [NOTE]
   * Admin only access.
   */
  create({ data }: { data: Omit<Manager, 'id'> }) {}
}
