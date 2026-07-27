import { CategoryDto } from './category.dto';

export interface CategoryApi {
  findById(id: string): Promise<CategoryDto>;
}
