import {
  STOCK_MOVEMENT_API,
  STOCK_QUERY_API,
  STOCK_RESERVATION_API,
} from '@feature/warehouse-api';
import { DrizzleDbModule } from '@infra/db-drizzle';
import { DrizzleOutboxModule } from '@infra/messaging-outbox';
import { Module } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { StockQuarantineController } from './controllers/quarantine.controller';
import { StockController } from './controllers/stock.controller';
import { StockMovementService } from './services/movement.service';
import { StockQuarantineService } from './services/quarantine.service';
import { StockMovementRepository } from './services/repositories/movement.repository';
import { StockQuarantineRepository } from './services/repositories/quarantine.repository';
import { StockReservationRepository } from './services/repositories/reservation.repository';
import { StockRepository } from './services/repositories/stock.repository';
import { StockReservationService } from './services/reservation.service';
import { StockService } from './services/stock.service';

@Module({
  imports: [DrizzleDbModule, DrizzleOutboxModule],
  providers: [
    { provide: AsyncLocalStorage, useValue: new AsyncLocalStorage() },
    StockRepository,
    StockMovementRepository,
    StockQuarantineRepository,
    StockReservationRepository,

    StockService,
    StockQuarantineService,
    StockMovementService,
    StockReservationService,
    {
      provide: STOCK_MOVEMENT_API,
      useExisting: StockMovementService,
    },
    {
      provide: STOCK_QUERY_API,
      useExisting: StockService,
    },
    {
      provide: STOCK_RESERVATION_API,
      useExisting: StockReservationService,
    },
  ],
  controllers: [StockController, StockQuarantineController],
  exports: [STOCK_MOVEMENT_API, STOCK_QUERY_API, STOCK_RESERVATION_API],
})
export class WarehouseModule {}
