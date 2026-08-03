export interface ResolveMarkupRequest {
  goodId: string;
  policy: 'wholesale' | 'retail';
}

export interface ResolveManyMarkupRequest {
  goodIds: string[];
  policy: 'wholesale' | 'retail';
}
