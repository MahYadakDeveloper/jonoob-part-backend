import { ApiCommand, ApiInput, ApiOutput } from '@feature/shared/command';
import { MovementApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReceiptMovementCommand implements ApiCommand<
  MovementApi,
  'issue'
> {
  async execute(
    input: ApiInput<MovementApi, 'issue'>,
  ): Promise<ApiOutput<MovementApi, 'issue'>> {}
}
