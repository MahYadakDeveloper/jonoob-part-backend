// FORBIDDEN for a depth-3 impl (modulePath: lint-sample-a/orders/items)
import { SAMPLE_A_API } from '@feature.api/lint-sample-a';
import { SAMPLE_A_BILLING_API } from '@feature.api/lint-sample-a-billing';
import { SAMPLE_A_ORDERS_API } from '@feature.api/lint-sample-a-orders';
import { SAMPLE_B_CATALOG_VARIANTS_API } from '@feature.api/lint-sample-b-catalog-variants';
import { SAMPLE_A_ORDERS_IMPL } from '@feature.impl/lint-sample-a-orders';

export const FORBIDDEN = [
  SAMPLE_A_ORDERS_API, // parent api (never anything above)
  SAMPLE_A_API, // grandparent api
  SAMPLE_A_BILLING_API, // sibling of the parent, not of this module
  SAMPLE_A_ORDERS_IMPL, // parent impl
  SAMPLE_B_CATALOG_VARIANTS_API, // depth-3 api of another feature
];
