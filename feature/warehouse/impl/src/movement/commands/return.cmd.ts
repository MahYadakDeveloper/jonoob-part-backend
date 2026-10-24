import { ApiCommand, ApiInput, ApiOutput } from '@feature/shared/command';
import { MovementApi } from '@feature/warehouse-api/';
import { Injectable } from '@nestjs/common';
import { MovementApiIn, MovementApiOut } from './movement.commands';
import { MovementRepository } from '../../movement.repository';

@Injectable()
export class ReturnMovementCommand implements ApiCommand<
  MovementApi,
  'return'
> {
  constructor(private readonly repository: MovementRepository) {}

  async execute(
    input: MovementApiIn<'return'>,
  ): Promise<MovementApiOut<'return'>> {}
}
