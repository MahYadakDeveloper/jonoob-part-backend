import { LineItems, type TransactionManager } from '@feature/common';
import type { WarehouseApi } from '@feature/warehouse-api';
import { type StockReserverApi } from '@feature/warehouse-reserve-api';
import { Inject, Injectable } from '@nestjs/common';
import { ReserveData, type ReserveRepository } from './reserve.repository';

@Injectable()
export class StockReserverService implements StockReserverApi {
  constructor(
    @Inject('WarehouseApi')
    private readonly warehouse: WarehouseApi,
    @Inject('ReserveRepository')
    private readonly repository: ReserveRepository,
    @Inject('TransactionManager')
    private readonly tx: TransactionManager,
  ) {}

  async reserve({
    referenceId,
    items,
  }: {
    referenceId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    await this.tx.run(async () => {
      await this.warehouse.decrease({ items });

      await this.repository.withLock(async () => {
        const reserved = await this.repository.findByReferenceId(referenceId);

        await this.repository.upsertMany(
          items.transform(
            (item) => {
              const reservedItem = reserved.get(item.stockId);

              return {
                ...item,
                referenceId,
                qty: item.qty + (reservedItem?.qty ?? 0),
              } satisfies ReserveData;
            },
            (r) => r.stockId,
          ),
        );
      });
    });
  }

  async release({
    referenceId,
    items,
  }: {
    referenceId: string;
    items: LineItems<{ stockId: string; qty: number }>;
  }): Promise<void> {
    await this.tx.run(async () => {
      await this.repository.withLock(async () => {
        const reserved = await this.repository.findByReferenceId(referenceId);

        const toDelete = new LineItems<{
          referenceId: string;
          stockId: string;
        }>((x) => x.stockId);
        const toUpsert = new LineItems<ReserveData>((x) => x.stockId);

        items.forEach((item) => {
          const reservedItem = reserved.get(item.stockId);

          // Nothing is reserved for this stock.
          if (!reservedItem) return;

          // Release the whole reservation.
          if (item.qty === reservedItem.qty) {
            toDelete.set({
              ...reservedItem,
            });
            return;
          }

          // Release part of the reservation.
          if (item.qty < reservedItem.qty) {
            toUpsert.set({
              ...reservedItem,
              qty: reservedItem.qty - item.qty,
            });
            return;
          }

          // Trying to release more than what is reserved.
          throw new Error(
            `Cannot release ${item.qty} units of stock ${item.stockId}; only ${reservedItem.qty} units are reserved.`,
          );
        });

        if (toUpsert.size > 0) {
          await this.repository.upsertMany(toUpsert);
        }

        if (toDelete.size > 0) {
          await this.repository.deleteMany(toDelete);
        }
      });

      await this.warehouse.increase({ items });
    });
  }

  getReservedStocks({
    referenceId,
  }: {
    referenceId: string;
  }): Promise<{ reserved: LineItems<{ stockId: string; qty: number }> }> {
    return this.repository
      .findByReferenceId(referenceId)
      .then((reserved) => ({ reserved }));
  }
}
