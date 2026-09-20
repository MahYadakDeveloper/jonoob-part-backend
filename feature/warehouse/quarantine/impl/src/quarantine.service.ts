import { type TransactionManager } from '@feature/common';
import { type ProcurementApi } from '@feature/procurement-api';
import { QuarantineStockRequest, StockQuarantineApi } from '@feature/warehouse-quarantine-api';
import { Injectable } from '@nestjs/common';
import { type StockQuarantineRepository } from './quarantine.repository';
import { ReleaseStockRequest, ReturnToSupplierRequest } from './quarantine.req';

@Injectable()
export class StockQuarantine implements StockQuarantineApi {
  constructor(
    private readonly procurement: ProcurementApi,
    private readonly repository: StockQuarantineRepository,
    private readonly tx: TransactionManager,
  ) {}

  quarantine({ items, reason, referenceId }: QuarantineStockRequest): Promise<void> {
    return this.repository.quarantine(
      items.transform(
        (q) => ({ referenceId: referenceId, reason: reason, ...q }),
        (q) => q.stockId,
      ),
    );
  }

  /**
   * Release to return to the warehouse
   */
  async release({ items }: ReleaseStockRequest): Promise<void> {
    await this.repository.release(items);
  }

  /**
   * Return the goods to supplier
   */
  async returnToSupplier({
    items,
    specialistId,
    supplierId,
  }: ReturnToSupplierRequest): Promise<{ returnId: string }> {
    return await this.tx.run(async () => {
      await this.repository.release(items);

      return this.procurement.returnSupply({
        specialistId,
        supplierId,
        items: items.transform(
          (s) => ({ goodId: s.stockId, quantity: s.qty }),
          (g) => g.goodId,
        ),
      });
    });
  }
}
