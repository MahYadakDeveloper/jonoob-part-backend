// ALLOWED for impl (modulePath: lint-sample-a/billing)
import { SAMPLE_A_BILLING_API } from '@feature.api/lint-sample-a-billing';
import { SAMPLE_A_ORDERS_API } from '@feature.api/lint-sample-a-orders';

export const ALLOWED = [
  SAMPLE_A_BILLING_API, // own api
  SAMPLE_A_ORDERS_API, // sibling api (same parent)
];
