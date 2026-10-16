import type { MerchandiseLineDiscount } from '@infra/db-drizzle/schema';

type MerchandiseLineItemBase = {
  productId: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type MerchandiseLine =
  | (MerchandiseLineItemBase & {
      kind: 'leaf';
      discount?: MerchandiseLineDiscount;
    })
  | (MerchandiseLineItemBase & {
      kind: 'bundle';
      discount?: MerchandiseLineDiscount;
      items: MerchandiseLineItemBase[];
    });
