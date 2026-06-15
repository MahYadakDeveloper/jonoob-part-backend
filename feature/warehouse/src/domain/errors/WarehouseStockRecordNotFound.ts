export class WarehouseStockRecordNotFoundError extends Error {
  constructor(goodsId: string) {
    super(`The looking goods with '${goodsId}' id not found in warehouse`);
    this.name = "WarehouseStockRecordNotFoundError";
  }
}
