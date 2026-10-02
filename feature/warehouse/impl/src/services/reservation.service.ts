import {
  StockReservationApi,
  StockReservationItem,
} from '@feature/warehouse-api';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { Injectable } from '@nestjs/common';
import { StockReservationRepository } from './repositories/stock-reservation.repository';
import { StockService } from './stock.service';

@Injectable()
export class StockReservationService implements StockReservationApi {
  constructor(
    private readonly stock: StockService,
    private readonly repository: StockReservationRepository,
    private readonly tx: DrizzleTransactionContext,
  ) {}

  reserve({
    items,
    idempotencyKey,
  }: {
    items: StockReservationItem[];
    idempotencyKey: string;
  }): Promise<{ reservationId: string }> {
    return this.tx.run(async () =>
      this.repository.withLock('reservation', idempotencyKey, async () => {
        const key = `reservation:${idempotencyKey}`;
        const reserve = await this.repository.findByIdempotencyKey(key);

        if (reserve)
          return {
            reservationId: reserve.id,
          };

        await this.stock.decrease(items);

        const { reservationId } = await this.repository.create(items, key);

        return {
          reservationId,
        };
      }),
    );
  }

  release(reservationId: string): Promise<void> {
    return this.tx.run(async () =>
      this.repository.withForUpdate(async () => {
        const reserve = await this.repository.findById(reservationId);

        if (!reserve) throw new Error();

        await this.stock.increase(reserve.items);

        await this.repository.delete(reservationId);
      }),
    );
  }
}
