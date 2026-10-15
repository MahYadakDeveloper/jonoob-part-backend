import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { type ConfirmPickupDto, ConfirmPickupSchema } from './delivery.dto';
import { DeliveryService } from './delivery.service';

@Controller()
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}
  @Get()
  findAll() {
    return this.delivery.findAll();
  }

  // [TODO] Add guard and ability
  @Post(':id')
  confirmPickup(
    @Param(':id', { schema: z.uuid() }) id: string,
    @Body({ schema: ConfirmPickupSchema }) dto: ConfirmPickupDto,
  ) {
    return this.delivery.confirmPickup(id, dto.courierId);
  }
}
