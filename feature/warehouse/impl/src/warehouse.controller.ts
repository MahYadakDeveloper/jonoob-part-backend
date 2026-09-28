import { type AuthenticatedUser } from '@feature/authentication-api';
import { User } from '@feature/authentication-nest';
import '@feature/common';
import { type TransactionManager } from '@feature/common';
import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
} from '@nestjs/common';
import { Outbox } from '@nestjs/outbox';
import z from 'zod';
import { type StockRepository } from './repository/stock.repository';

const decreaseReqBody = z.object(
  {
    qty: z.coerce.number({ error: 'Are you dumb?!' }),
    delayMs: z.coerce.number(),
  },
  { error: 'Are you dumb?!' },
);

@Controller('warehouse')
export class WarehouseController {
  private readonly logger = new Logger(WarehouseController.name);

  constructor(
    @Inject('StockRepository') private readonly stocks: StockRepository,
    @Inject('TransactionManager') private readonly tx: TransactionManager,

    private readonly outbox: Outbox,
  ) {}

  @Get(':id')
  stock(@Param('id') stockId: string) {
    return this.tx.run(async () =>
      this.stocks.withLock(async () => {
        const s = await this.stocks.findById(stockId);
        if (!s) throw new Error('Huh??');

        await this.stocks.increase(
          [{ id: stockId, qty: 5 }].toLineItems((s) => s.id),
        );

        await this.outbox.add(null, {
          topic: 'stock.get',
          payload: { x: 'X' },
        });
      }),
    );
  }

  // @UseGuards(AuthenticationGuard, PoliciesGuard)
  // @CheckPolicies({
  //   abilityFactory: WarehouseAbilityFactory,
  //   handlers: [ManageWarehousePolicy],
  // })
  @Patch('decrease/:id')
  async decrease(
    @Param('id') stockId: string,
    @Body({ schema: decreaseReqBody }) body: z.infer<typeof decreaseReqBody>,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log('User:', user);
    return this.tx.run(async () =>
      this.stocks.withLock(async () => {
        const s = await this.stocks.findById(stockId);
        if (!s) throw new Error('Not found');
        if (s.qty < body.qty) throw new Error('Insufficient stock');

        await new Promise((res) => setTimeout(res, body.delayMs));

        await this.stocks.decrease(
          [{ id: stockId, qty: body.qty }].toLineItems((s) => s.id),
        );
      }),
    );
  }
}
