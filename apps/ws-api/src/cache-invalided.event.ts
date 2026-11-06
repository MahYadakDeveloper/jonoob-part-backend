export const CacheInvalidationJobName = 'cache-invalided';

export const CacheTags = {
  Product: 'product',
  Price: 'price',
} as const;

export type CacheTag = (typeof CacheTags)[keyof typeof CacheTags];

export type CacheInvalidationJobPayload = {
  tag: CacheTag;
} & (
  | {
      scope: 'one';
      cacheId: string;
    }
  | {
      scope: 'many';
      cacheIds: string[];
    }
  | {
      scope: 'all';
    }
);
