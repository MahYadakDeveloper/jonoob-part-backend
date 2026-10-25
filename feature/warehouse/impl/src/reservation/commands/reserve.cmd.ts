import { ApiCommand } from '@feature/shared/command';
import { assertMaps } from '@feature/shared/utils/assertions';
import { ReservationApi, ReserveStocksInput } from '@feature/warehouse-api';
import { ConflictException } from '@nestjs/common';
import { StockRepository } from '../../stock.repository';
import { ReservationRepository } from '../reservation.repository';

export class ReserveCommand implements ApiCommand<ReservationApi, 'reserve'> {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly stocks: StockRepository,
  ) {}
  execute(input: ReserveStocksInput): Promise<{ reservationId: string }> {
    return this.reservations.transaction(async () =>
      this.reservations.withForUpdate(async () => {
        const requested = input.items.toMap('stockId', (a, b) => ({
          ...a,
          quantity: a.quantity + b.quantity,
        }));

        const stocks = await this.stocks.findManyStockById([
          ...requested.keys(),
        ]);

        assertMaps(
          requested,
          stocks.toMap('id'),
          (r, s) => r.quantity <= s.quantity,
          () => new ConflictException('Insufficient stock'),
        );

        await this.stocks.decrease(input.items);

        const { reservationId } = await this.reservations.reserve(input.items);

        return {
          reservationId,
        };
      }),
    );
  }
}
