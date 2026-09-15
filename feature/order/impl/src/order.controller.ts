import { Controller, Get, Param, Post } from '@nestjs/common';
import createAbilityFor from './casl.ability';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get(':id')
  async order(@Param() id: string) {
    const ability = createAbilityFor({ role: 'customer', id: '1' });

    const order = await this.orderService.findById({ orderId: id });
    ability.can('read', order);
  }

  @Post()
  record() {}
}
