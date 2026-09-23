import { Controller, Get, Inject, Param } from '@nestjs/common';
import { type StockRepository } from './repository/stock.repository';

@Controller('warehouse')
export class WarehouseController {
  constructor(
    @Inject('StockRepository') private readonly stocks: StockRepository,
  ) {}

  @Get(':id')
  stock(@Param('id') stockId: string) {
    const start = performance.now();
    const x = this.stocks.findById(stockId);
    console.log('repository:', performance.now() - start);
    return x;
  }
}
