import {
  ReleaseReservationInput,
  ReservationApi,
  ReserveStocksInput,
} from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { ReservationApiCommands } from './commands/reservation.commands';

@Injectable()
export class ReservationApiImpl implements ReservationApi {
  constructor(private readonly commands: ReservationApiCommands) {}

  reserve = (input: ReserveStocksInput) => this.commands.reserve.execute(input);
  release = (input: ReleaseReservationInput) =>
    this.commands.release.execute(input);
}
