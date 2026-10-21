import {
  GetManagerByIdInput,
  GetManagerByPhoneInput,
  Manager,
  ManagerApi,
} from '@feature/actors-api/manager';
import { ensureFound } from '@feature/shared/utils/assertions';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ManagerRepository } from './manager.repository';

@Injectable()
export class ManagerService implements ManagerApi {
  constructor(private readonly repository: ManagerRepository) {}

  getById({ managerId }: GetManagerByIdInput) {
    return this.repository
      .findById(managerId)
      .then((m) =>
        ensureFound(m, () => new NotFoundException('Manager not found')),
      );
  }

  getByPhone({ phone }: GetManagerByPhoneInput) {
    return this.repository
      .findByPhone(phone)
      .then((m) =>
        ensureFound(
          m,
          () => new NotFoundException(`Manager not found with ${phone} number`),
        ),
      );
  }

  create({ data }: { data: Omit<Manager, 'id'> }) {}
}
