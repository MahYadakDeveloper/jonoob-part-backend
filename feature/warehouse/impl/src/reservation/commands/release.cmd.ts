import { ApiCommand } from '@feature/shared/command';
import {
  ReleaseReservationInput,
  ReservationApi,
} from '@feature/warehouse-api';
import { StockRepository } from '../../stock.repository';
import { ReservationRepository } from '../reservation.repository';

export class ReleaseApiCommand implements ApiCommand<
  ReservationApi,
  'release'
> {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly stocks: StockRepository,
  ) {}
  execute(input: ReleaseReservationInput): Promise<void> {
    return this.reservations.transaction(() =>
      this.reservations.withForUpdate(async () => {
        const reservedItems = await this.reservations.findReservedItems(
          input.reservationId,
        );

        await this.stocks.increase(reservedItems);

        await this.reservations.release(input.reservationId);
      }),
    );
  }
}
