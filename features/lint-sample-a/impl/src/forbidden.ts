// FORBIDDEN for the root impl (modulePath: lint-sample-a, no parent)
import { SAMPLE_A_ORDERS_ITEMS_API } from '@feature.api/lint-sample-a-orders-items';
import { SAMPLE_A_HTTP } from '@feature.http/lint-sample-a';
import { SAMPLE_A_BILLING_IMPL } from '@feature.impl/lint-sample-a-billing';
import { SAMPLE_A_ORDERS_IMPL } from '@feature.impl/lint-sample-a-orders';
import { SAMPLE_A_WS } from '@feature.ws/lint-sample-a';

export const FORBIDDEN = [
  SAMPLE_A_ORDERS_ITEMS_API, // grandchild api (depth 3, two levels lower)
  SAMPLE_A_ORDERS_IMPL, // child impl (api only)
  SAMPLE_A_BILLING_IMPL, // child impl (api only)
  SAMPLE_A_HTTP, // another layer (http)
  SAMPLE_A_WS, // another layer (ws)
];
