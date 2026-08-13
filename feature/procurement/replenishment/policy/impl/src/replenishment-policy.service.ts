import { PageCriteria, PageResult } from '@feature/common';
import { Injectable } from '@nestjs/common';
import { ReplenishmentPolicy } from './model/replenishment';
import { type ReplenishmentPolicyRepository } from './replenishment-policy.repository';

@Injectable()
export class ReplenishmentPolicyService {
  constructor(private readonly repository: ReplenishmentPolicyRepository) {}
  list({ criteria }: { criteria: PageCriteria }): Promise<PageResult<ReplenishmentPolicy>> {
    return this.repository.list(criteria);
  }

  addPolicy({ policy }: { policy: ReplenishmentPolicy }) {
    return this.repository.create(policy);
  }

  removePolicy({ goodId }: { goodId: string }) {
    return this.repository.delete(goodId);
  }
}
