import { Controller, Delete, Get, Post, Put } from '@nestjs/common';

@Controller('fitment/model')
export class FitmentModelController {
  @Get(':id')
  findOne() {}
  @Post()
  createOne() {}
  @Put()
  updateOne() {}
  @Delete()
  deleteOne() {}
}
