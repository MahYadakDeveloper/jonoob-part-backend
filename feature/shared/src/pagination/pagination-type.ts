export type Pagination = OffsetPagination | CursorPagination;

export interface OffsetPagination {
  type: 'offset';

  page: number;

  size: number;
}

export interface CursorPagination {
  type: 'cursor';

  after?: string;

  size: number;
}
