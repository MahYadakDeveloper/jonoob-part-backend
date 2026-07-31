import { Controller, Delete, Get, Post, Put } from '@nestjs/common';

@Controller('fitment/fuel-type')
export class FitmentSeriesController {
  @Get(':id')
  findOne() {}

  @Post()
  createOne() {
    // ...
  }

  @Put()
  updateOne() {}

  @Delete()
  deleteOne() {}
}
