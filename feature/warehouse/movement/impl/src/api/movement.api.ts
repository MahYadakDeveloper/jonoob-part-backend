import { MovementApi } from '@feature/warehouse-api';
import { MovementApiIn, MovementCommands } from './commands/movement.commands';

export class MovementApiImpl implements MovementApi {
  constructor(private readonly cmds: MovementCommands) {}

  issue = (i: MovementApiIn<'issue'>) => this.cmds.issue.execute(i);
  receipt = (i: MovementApiIn<'receipt'>) => this.cmds.receipt.execute(i);
  return = (i: MovementApiIn<'return'>) => this.cmds.return.execute(i);
  undo = (i: MovementApiIn<'undo'>) => this.cmds.undo.execute(i);
}
