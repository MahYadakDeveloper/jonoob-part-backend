import { MovementApi } from '@feature/warehouse-api/movement';
import { MovementCommands } from './commands/movement.commands';
import { InputOf } from '@feature/shared/cqrs';

export class MovementApiImpl implements MovementApi {
  constructor(private readonly cmds: MovementCommands) {}

  issue = (i: InputOf<MovementApi, 'issue'>) => this.cmds.issue.execute(i);
  receipt = (i: InputOf<MovementApi, 'receipt'>) =>
    this.cmds.receipt.execute(i);
  return = (i: InputOf<MovementApi, 'return'>) => this.cmds.return.execute(i);
  undo = (i: InputOf<MovementApi, 'undo'>) => this.cmds.undo.execute(i);
}
