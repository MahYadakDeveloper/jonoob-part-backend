import { ApiCommand, ApiInput, ApiOutput } from '@feature/shared/command';
import { MovementApi, UndoMovementInput } from '@feature/warehouse-api/';
import { Injectable } from '@nestjs/common';
import { MovementRepository } from '../movement.repository';
import { StockRepository } from '../../stock.repository';

@Injectable()
export class UndoMovementCommand implements ApiCommand<MovementApi, 'undo'> {
constructor(
    private readonly movements: MovementRepository,
    private readonly stocks: StockRepository,
  ) {}
  execute(input: UndoMovementInput): Promise<void> {
    return this.movements.transaction(() => )
  }
}
