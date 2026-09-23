import { Controller, Get, Param } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';

@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouse: WarehouseService) {}

  @Get(':id')
  stock(@Param('id') stockId: string) {
    return this.warehouse.findById({ stockId });
  }
}
