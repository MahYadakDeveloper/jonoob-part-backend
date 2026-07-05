import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GoodsIssuedEvent } from "@feature/warehouse-api";

@Injectable()
export class Procurement {
  @OnEvent("warehouse.goods-issued")
  handlerGoodsIssuedEvent(event: GoodsIssuedEvent) {
    throw new Error("Method not implement yet!");
  }
}
