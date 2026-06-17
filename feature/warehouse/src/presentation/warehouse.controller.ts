import { Body, Controller, Get, Logger, Param, Post } from "@nestjs/common";
import { type RecordGoodsReceiptInputDto } from "src/application/dto/record-goods-receipt-dto";
import { WarehouseService } from "../application/warehouse.service";

@Controller()
export class WarehouseController {
  private readonly logger: Logger;
  constructor(private readonly warehouseService: WarehouseService) {
    this.logger = new Logger(WarehouseController.name);
  }

  /**
   *  NOTE: Using parameters directly is wrong and validation required and usually
   * done with pipes from nest.
   */
  @Get(":id")
  async getGoodStock(@Param("id") id: string) {
    return await this.warehouseService.getGoodStock({ goodsId: id });
  }

  @Post()
  async receiptGood(@Body() itemDto: RecordGoodsReceiptInputDto["items"][0]) {
    this.logger.log("The body post:", itemDto);
    return this.warehouseService.recordGoodsReceipt({ items: [itemDto] });
  }
}
