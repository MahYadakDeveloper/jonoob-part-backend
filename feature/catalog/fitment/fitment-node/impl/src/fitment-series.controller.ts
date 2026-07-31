import { Controller, Delete, Get, Post, Put } from '@nestjs/common';

@Controller('fitment/series')
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
