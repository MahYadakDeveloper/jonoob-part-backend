import { Controller, Get, Query } from "@nestjs/common";
import { CatalogService } from "catalog.service";

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService
  ){}

  @Get(':id')
  async product() {}

  @Get()
  async products(@Query('page') page: number, @Query('limit') limit: number) {}

  // POST, DELETE, ...
}