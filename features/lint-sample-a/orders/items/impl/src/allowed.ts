// ALLOWED for a depth-3 impl (modulePath: lint-sample-a/orders/items)
import { SAMPLE_A_ORDERS_ITEMS_API } from '@feature.api/lint-sample-a-orders-items';
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';

export const ALLOWED = [
  SAMPLE_A_ORDERS_ITEMS_API, // own api
  SAMPLE_B_API, // root api of another feature
];
