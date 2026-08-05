export const ProductUpdatedEventJobName = 'product.updated';
export type ProductUpdatedEventJobPayload = {
  tag: 'product';
  productId: string;
};

export const ProductDeletedEventJobName = 'product.deleted';
export type ProductDeletedEventJobPayload = {
  tag: 'product';
  productId: string;
};
