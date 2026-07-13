import { ProductBundleKind, ProductLeafKind } from "@feature/common";

export type ProductProjection =
  | (ProductLeafKind & {
      id: string;
      description: string;
    })
  | (ProductBundleKind & {
      id: string;
      description: string;
      items: {
        product: ProductProjection;
        quantity: number;
      }[];
    });
