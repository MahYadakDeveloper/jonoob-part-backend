import {
  ApiInput,
  ApiOutput,
  Commands,
  MethodKeys,
} from '@feature/shared/command';
import { MovementApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { IssueMovementCommand } from './issue.cmd';
import { ReceiptMovementCommand } from './receipt.cmd';
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
export class MovementCommands implements Commands<MovementApi> {
  constructor(
    readonly issue: IssueMovementCommand,
    readonly receipt: ReceiptMovementCommand,
    readonly undo: UndoMovementCommand,
  ) {}
}
