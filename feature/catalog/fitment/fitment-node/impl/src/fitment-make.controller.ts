import { Controller, Delete, Get, Post, Put } from '@nestjs/common';

@Controller('fitment/make')
export class FitmentMakeController {
  @Get(':id')
  findOne() {}
  @Post()
  createOne() {}
  @Put()
  updateOne() {}
  @Delete()
  deleteOne() {}
}
