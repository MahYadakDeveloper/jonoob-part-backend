export interface IssueGoodsRequest {
  items: {
    goodsId: string;
    quantity: number;
  }[];
}

export interface ReserveStocksRequest {
  items: {
    goodsId: string;
    quantity: number;
  }[];
}

export interface ReleaseStocksRequest {
  items: {
    goodsId: string;
    quantity: number;
  }[];
}

export interface UnitOfMeasuresOfProductsRequest {
  productIds: string[];
}
