export interface IssueGoodsRequest {
  items: {
    goodsId: string;
    quantity: number;
  }[];
}

export interface UnitOfMeasuresOfProductsRequest {
  productIds: string[];
}
