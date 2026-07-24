import { Barcode } from "@feature/common";
import { Product } from "model/product";

export interface FindProductByBarcodeRequest {
  barcode: Barcode;
  enrich?: true;
  populate?: true;
}

export interface FindProductByBarcodeResponse {
  product: Product;
}
