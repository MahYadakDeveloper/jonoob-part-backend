import { Packaging } from "@feature/shared";

export interface RecordSaleInputDto {
  cashierId: string;
  customerInfo?: {
    id: string;
    useCredit?: true;
  };
  items: {
    productId: string;
    quantity: number;
    unit: Packaging;
  }[];
}
