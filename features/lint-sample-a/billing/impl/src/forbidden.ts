// FORBIDDEN for impl (modulePath: lint-sample-a/billing)
import { SAMPLE_A_BILLING_API } from '@feature.api/lint-sample-a-billing';
import { SAMPLE_A_ORDERS_ITEMS_API } from '@feature.api/lint-sample-a-orders-items';
import { SAMPLE_A_ORDERS_IMPL } from '@features/lint-sample-a/orders/impl';

export const FORBIDDEN = [
  SAMPLE_A_ORDERS_ITEMS_API, // child of a sibling (depth 3)
  SAMPLE_A_ORDERS_IMPL, // sibling impl (api only)
];

const x = SAMPLE_A_BILLING_API