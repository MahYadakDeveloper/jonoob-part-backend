import { type CatalogApi } from '@feature/catalog-api';
import { LineItems } from '@feature/common';
import { type ReplenishmentApi } from '@feature/procurement-replenishment-api';
import { Injectable } from '@nestjs/common';
import { ProcurementRequest } from './model/procurement-request';
import { type ProcurementRequestRepository } from './procurement-request.repository';

/**
 * [NOTE]
 *  The replenishment is automatically removed after replenished
 * and for removing the manual requests have to mark them as
 * supplied
 */
@Injectable()
export class ProcurementRequestService {
  constructor(
    private readonly repository: ProcurementRequestRepository,
    private readonly replenishment: ReplenishmentApi,
    private readonly catalog: CatalogApi,
  ) {}

  async replenishmentRequestList() {
    const { replenishment } = await this.replenishment.findAll({});
    const { products } = await this.catalog.findManyByGoodId({
      goodIds: replenishment.toArray().map((r) => r.goodId),
    });

    const displayNames = products.toArray().map((p) => p.displayName);

    const requests = new LineItems<ProcurementRequest>((r) => r.displayName);
    requests.setMany(displayNames.map((displayName) => ({ displayName })));

    return {
      requests: [...requests.toArray()],
    };
  }

  async demandRequestList() {
    const requests = await this.repository.findAll({});

    return {
      requests: [...requests.toArray()],
    };
  }

  addRequest({ request }: { request: ProcurementRequest }) {
    return this.repository.create(request);
  }

  requestSupplied({ displayName }: { displayName: string }) {
    return this.repository.delete(displayName);
  }
}
