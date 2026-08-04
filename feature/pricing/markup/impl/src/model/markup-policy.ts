export type GlobalMarkupPolicy =
  | {
      rate: number;
      scope: 'global_wholesale';
    }
  | {
      rate: number;
      scope: 'global_retail';
    };

export type MarkupPolicy =
  | {
      id: string;
      rate: number;
      scope: 'product';
      referenceId: string;
    }
  | {
      id: string;
      rate: number;
      scope: 'brand';
      priority: number;
      referenceId: string;
    }
  | {
      id: string;
      rate: number;
      scope: 'category';
      priority: number;
      referenceId: string;
    };

export type MarkupScope = 'brand' | 'category' | 'product';
