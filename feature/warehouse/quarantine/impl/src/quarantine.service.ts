import {
  QuarantineStockRequest,
  ReleaseStockRequest,
  StockQuarantineApi,
} from '@feature/warehouse-quarantine-api';
import { ReturnToSupplierRequest } from './quarantine.req';
import { ProcurementApi } from '@feature/procurement-api';

export class StockQuarantine implements StockQuarantineApi {
  constructor(private readonly procurement: ProcurementApi) {}
  quarantine(req: QuarantineStockRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * Release to enter the warehouse
   */
  async release(req: ReleaseStockRequest): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * Return the goods to supplier
   */
  returnToSupplier(req: ReturnToSupplierRequest): Promise<{ returnId: string }> {
    return this.returnToSupplier(req);
  }
}
