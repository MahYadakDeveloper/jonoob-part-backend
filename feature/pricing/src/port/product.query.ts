import { LineItems, ProductBundleKind, ProductLeafKind } from "@feature/common";

export type Product =
  | (ProductLeafKind & {
      id: string;
    })
  | (ProductBundleKind & {
      id: string;
      items: LineItems<{
        id: string;
        qty: number;
      }>;
    });

export interface IProductQuery {
  find(id: string): Promise<Product | undefined>;
  findMany(ids: string[]): Promise<LineItems<Product>>;
}
