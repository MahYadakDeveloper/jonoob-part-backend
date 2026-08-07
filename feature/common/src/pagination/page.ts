import { PageInfo } from './page-info';

export interface Page<T> extends PageInfo {
  items: readonly T[];
}
