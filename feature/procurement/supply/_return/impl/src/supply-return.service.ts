import { PageCriteria, PageResult, type TransactionManager } from '@feature/common';
import {
  RecordSupplyReturnRequest,
  RecordSupplyReturnResponse,
  SupplyReturnApi,
} from '@feature/procurement-supply-return-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { SupplyReturnDocument } from './model/supply-return';
import { type SupplyReturnRepository } from './supply-return.repository';

@Injectable()
export class SupplyReturnService implements SupplyReturnApi {
  constructor(
    private readonly repository: SupplyReturnRepository,
    private readonly warehouse: WarehouseApi,
    private readonly tx: TransactionManager,
  ) {}

  documents({ criteria }: { criteria: PageCriteria }): Promise<PageResult<SupplyReturnDocument>> {
    return this.repository.documents(criteria);
  }

  async recordSupplyReturn(req: RecordSupplyReturnRequest): Promise<RecordSupplyReturnResponse> {
    const returnId = await this.repository.create({ ...req });
    return {
      returnId,
    };
  }

  async goodsReturnedToSupplier({ returnId }: { returnId: string }) {
    await this.repository.updateStatus(returnId, 'returnedToSupplier');
  }

  async returnGoodsToWarehouse({ returnId }: { returnId: string }) {
    const supplyReturn = await this.repository.findById(returnId);
    await this.tx.run(async () => {
      await this.warehouse.receiptGoods({
        reference: {
          source: 'supply-return',
          id: returnId,
        },
        items: supplyReturn.items,
      });

      await this.repository.updateStatus(returnId, 'returnedToWarehouse');
    });
  }

  async goodsIsDamaged({ returnId }: { returnId: string }) {
    await this.repository.updateStatus(returnId, 'damaged');
  }
}
