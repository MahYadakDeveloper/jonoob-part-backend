import { type TransactionManager } from '@feature/common';
import { type WarehouseApi } from '@feature/warehouse-api';
import {
  StockReleasingRequest,
  StockReservingRequest,
  type StockReserverApi,
} from '@feature/warehouse-reserve-api';
import { Injectable } from '@nestjs/common';
import { type ReserveRepository } from './reserve.repository';

@Injectable()
export class StockReserverService implements StockReserverApi {
  constructor(
    private readonly repository: ReserveRepository,
    private readonly warehouse: WarehouseApi,
    private readonly tx: TransactionManager,
  ) {}
  async reserveStock(req: StockReservingRequest): Promise<void> {
    await this.tx.run(async () => {
      await this.warehouse.decreaseStocks(req);
      await this.repository.reserve(req.items);
    });
  }

  async releaseStock(req: StockReleasingRequest): Promise<void> {
    await this.tx.run(async () => {
      await this.warehouse.increaseStocks(req);
      await this.repository.release(req.items);
    });
  }
}
