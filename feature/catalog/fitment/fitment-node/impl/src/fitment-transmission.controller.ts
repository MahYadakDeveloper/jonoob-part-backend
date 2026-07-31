import { Controller, Delete, Get, Post, Put } from '@nestjs/common';

@Controller('fitment/transmission')
export class FitmentTransmissionController {
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
