import {
  type ApiCommand,
  ApiCommands,
  ApiInput,
  ApiOutput,
  MethodKeys,
} from '@feature/shared/command';
import { MovementApi } from '@feature/warehouse-api';
import { Inject, Injectable } from '@nestjs/common';
import { IssueMovementCommand } from './issue.cmd';
import { ReceiptMovementCommand } from './receipt.cmd';
import { ReturnMovementCommand } from './return.cmd';
import { UndoMovementCommand } from './undo.cmd';

export type MovementApiIn<M extends MethodKeys<MovementApi>> = ApiInput<
  MovementApi,
  M
>;

export type MovementApiOut<M extends MethodKeys<MovementApi>> = ApiOutput<
  MovementApi,
  M
>;

@Injectable()
export class MovementCommands implements ApiCommands<MovementApi> {
  @Inject(IssueMovementCommand)
  readonly issue: ApiCommand<MovementApi, 'issue'>;
  @Inject(ReceiptMovementCommand)
  readonly receipt: ApiCommand<MovementApi, 'receipt'>;
  @Inject(ReturnMovementCommand)
  readonly return: ApiCommand<MovementApi, 'return'>;
  @Inject(UndoMovementCommand)
  readonly undo: ApiCommand<MovementApi, 'undo'>;
}
