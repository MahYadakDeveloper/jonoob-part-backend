import { type TransactionManager } from '@feature/common';
import { type ProcurementApi } from '@feature/procurement-api';
import {
  QuarantineStockRequest,
  ReleaseStockRequest,
  StockQuarantineApi,
} from '@feature/warehouse-quarantine-api';
import { Injectable } from '@nestjs/common';
import { type StockQuarantineRepository } from './quarantine.repository';
import { ReturnToSupplierRequest } from './quarantine.req';

@Injectable()
export class StockQuarantine implements StockQuarantineApi {
  constructor(
    private readonly procurement: ProcurementApi,
    private readonly repository: StockQuarantineRepository,
    private readonly tx: TransactionManager,
  ) {}
  async quarantine(req: QuarantineStockRequest): Promise<void> {
    await this.repository.quarantineMany(
      req.items.transform(
        (q) => ({ referenceId: req.referenceId, reason: req.reason, ...q }),
        (q) => q.goodId,
      ),
    );
  }

  /**
   * Release to return to the warehouse
   */
  async release(req: ReleaseStockRequest): Promise<void> {
    await this.repository.releaseMany(req.items);
  }

  /**
   * Return the goods to supplier
   */
  async returnToSupplier(req: ReturnToSupplierRequest): Promise<{ returnId: string }> {
    return await this.tx.run(async () => {
      await this.repository.releaseMany(req.items);

      return this.procurement.returnSupply(req);
    });
  }
}
