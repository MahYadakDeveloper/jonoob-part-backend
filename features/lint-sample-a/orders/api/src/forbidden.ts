// FORBIDDEN for api: nothing but its own package (and externals)
import { SAMPLE_A_BILLING_API } from '@feature.api/lint-sample-a-billing';
import { SAMPLE_A_ORDERS_ITEMS_API } from '@feature.api/lint-sample-a-orders-items';
import { SAMPLE_A_ORDERS_IMPL } from '@feature.impl/lint-sample-a-orders';
import { ProblemException } from '@shared/error';

export const FORBIDDEN = [
  SAMPLE_A_BILLING_API, // sibling api
  SAMPLE_A_ORDERS_ITEMS_API, // child api
  SAMPLE_A_ORDERS_IMPL, // impl
  ProblemException, // shared/error
];
