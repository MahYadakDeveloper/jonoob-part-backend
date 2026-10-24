import { Injectable } from "@nestjs/common";
import { MovementRepository } from "../movement.repository";
import { StockRepository } from "../../stock/stock.repository";

@Injectable()
export class IssueMovementCommand {
  constructor(
    private readonly movements: MovementRepository,
  ) {}

  execute(input: ): Promise<MovementResult> {
    return this.movements.transaction(async () => {
      const { movementId, created } = await this.movements.insertIssue(input);

      if (created) {
        await this.stocks.decrease(input.items);
      }

      return { movementId, created };
    });
  }
}