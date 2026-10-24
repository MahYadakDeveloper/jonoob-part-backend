import { ApiCommand, ApiInput, ApiOutput } from '@feature/shared/command';
import { MovementApi } from '@feature/warehouse-api/';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UndoMovementCommand implements ApiCommand<MovementApi, 'undo'> {
  async execute(
    input: ApiInput<MovementApi, 'undo'>,
  ): Promise<ApiOutput<MovementApi, 'undo'>> {}
}
