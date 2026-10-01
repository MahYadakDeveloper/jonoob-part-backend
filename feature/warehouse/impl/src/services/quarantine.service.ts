import { type TransactionManager } from '@feature/common';
import { type ProcurementApi } from '@feature/procurement-api';
import {
  QuarantineStockRequest,
  StockQuarantineApi,
} from '@feature/warehouse-quarantine-api';
import { Injectable } from '@nestjs/common';
import {
  QuarantinedStock,
  type StockQuarantineRepository,
} from './quarantine.repository';
import { ReleaseStockRequest } from './quarantine.req';

@Injectable()
export class StockQuarantine implements StockQuarantineApi {
  constructor(
    private readonly procurement: ProcurementApi,
    private readonly repository: StockQuarantineRepository,
    private readonly tx: TransactionManager,
  ) {}

  all(): Promise<QuarantinedStock[]> {
    return this.repository.findAll();
  }

  quarantine({
    items,
    reason,
    referenceId,
  }: QuarantineStockRequest): Promise<void> {
    return this.repository.quarantine(
      items.map((q) => ({ referenceId: referenceId, reason: reason, ...q })),
    );
  }

  /**
   * Release to return to the warehouse
   */
  release({ quarantines }: ReleaseStockRequest): Promise<void> {
    return this.repository.release(quarantines);
  }
}
