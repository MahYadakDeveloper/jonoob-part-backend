export interface ProductDto {
  id: string;
  references: {
    brandId?: string;
    categoryIds: string[];
  };
}
