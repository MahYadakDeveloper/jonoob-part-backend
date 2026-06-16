import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { type RecordGoodsReceiptInputDTO } from "src/application/dto/record-goods-receipt-dto";
import { WarehouseService } from "../application/warehouse.service";

@Controller()
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  /**
   *  NOTE: Using parameters directly is wrong and validation required and usually
   * done with pipes from nest.
   */
  @Get(":id")
  async getGoodStock(@Param("id") id: string) {
    return await this.warehouseService.getGoodStock({ goodsId: id });
  }

  @Post()
  async receiptGood(@Body() item: RecordGoodsReceiptInputDTO["items"][0]) {
    return this.warehouseService.recordGoodsReceipt({ items: [item] });
  }
}
