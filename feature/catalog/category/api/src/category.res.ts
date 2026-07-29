import { LineItems } from '@feature/common';
import { CategoryDto } from './category.dto';

export interface FindCategoryResponse {
  category: CategoryDto;
}

export interface FindManyCategoryResponse {
  categories: LineItems<CategoryDto>;
}
