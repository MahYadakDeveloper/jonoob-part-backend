import { type ApiCommand, ApiCommands } from '@feature/shared/command';
import { ReservationApi } from '@feature/warehouse-api';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ReservationApiCommands implements ApiCommands<ReservationApi> {
  @Inject()
  release: ApiCommand<ReservationApi, 'release'>;
  @Inject()
  reserve: ApiCommand<ReservationApi, 'reserve'>;
}
