import { LineItems } from '@feature/common';

export type ProductDto =
  | {
      id: string;
      kind: 'leaf';
      goodId: string;
      displayName: string;
      references: {
        brandId?: string;
        categoryIds: string[];
      };
    }
  | {
      id: string;
      kind: 'bundle';
      displayName: string;
      references: {
        brandId?: string;
        categoryIds: string[];
      };
      items: LineItems<{
        productId: string;
        goodId: string;
        quantity: number;
        displayName: string;
        references: {
          brandId?: string;
          categoryIds: string[];
        };
      }>;
    };
