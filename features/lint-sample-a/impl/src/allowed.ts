// ALLOWED for the root impl (modulePath: lint-sample-a, no parent)
import { SAMPLE_A_API } from '@feature.api/lint-sample-a';
import { SAMPLE_A_ORDERS_API } from '@feature.api/lint-sample-a-orders';
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';

export const ALLOWED = [
  SAMPLE_A_API, // own api
  SAMPLE_A_ORDERS_API, // child api (one level lower)
  SAMPLE_B_API, // root api of another feature
];
