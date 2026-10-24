import { ApiCommand, ApiInput, ApiOutput } from '@feature/shared/command';
import { MovementApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReceiptMovementCommand implements ApiCommand<
  MovementApi,
  'receipt'
> {
  async execute(
    input: ApiInput<MovementApi, 'receipt'>,
  ): Promise<ApiOutput<MovementApi, 'receipt'>> {}
}
