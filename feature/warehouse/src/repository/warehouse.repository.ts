export interface IWarehouseRepository {
  issueGoods(): Promise<void>;
}
