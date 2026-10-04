import { ReturnReason } from '@feature/warehouse-api';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import {
  QuarantinedStock,
  type StockQuarantineRepository,
} from './quarantine.repository';

export interface ReleaseStockRequest {
  quarantines: { id: string; qty: number }[];
}

export interface ReturnToSupplierRequest {
  specialistId: string;
  supplierId: string;
  quarantines: { id: string; qty: number }[];
}

@Injectable()
export class StockQuarantineService {
  constructor(
    private readonly repository: StockQuarantineRepository,
    private readonly tx: DrizzleTransactionContext,
  ) {}

  page(): Promise<QuarantinedStock[]> {
    return this.repository.findAll();
  }

  async quarantineMany(
    items: {
      stockId: string;
      reason: ReturnReason;
      note?: string;
      movementId: string;
    }[],
  ): Promise<void> {
    this.repository.createMany();
  }

  /**
   * Release to return to the warehouse
   */
  release({ quarantines }: ReleaseStockRequest): Promise<void> {
    return this.repository.release(quarantines);
  }
}
