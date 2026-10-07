import { ReturnReason } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { StockQuarantineRepository } from './repositories/quarantine.repository';

@Injectable()
export class StockQuarantineService {
  constructor(private readonly repository: StockQuarantineRepository) {}

  page(criteria: Parameters<StockQuarantineRepository['page']>[0]) {
    return this.repository.page(criteria);
  }

  async quarantineMany(
    items: {
      stockId: string;
      reason: ReturnReason;
      note?: string;
      movementId: string;
    }[],
  ): Promise<void> {
    this.repository.createMany(items);
  }

  release(quarantineId: string): Promise<void> {
    return this.repository.delete(quarantineId);
  }
}
