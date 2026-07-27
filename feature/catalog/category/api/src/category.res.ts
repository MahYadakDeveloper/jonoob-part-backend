import { LineItems } from '@feature/common';
import { CategoryDto } from './category.dto';

export interface FindOneResponse {
  category: CategoryDto;
}

export interface FindManyResponse {
  categories: LineItems<CategoryDto>;
}
