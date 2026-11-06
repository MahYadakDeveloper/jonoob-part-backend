// ALLOWED for infrastructure: itself, shared and any feature impl
import { SAMPLE_B_IMPL } from '@feature.impl/lint-sample-b';
import { SAMPLE_A_ORDERS_ITEMS_IMPL } from '@feature.impl/lint-sample-a-orders-items';
import { ProblemException } from '@shared/error';
import { INFRA_LINT_SAMPLE } from './index';

export const ALLOWED = [
  INFRA_LINT_SAMPLE, // same infrastructure root
  SAMPLE_B_IMPL, // feature impl
  SAMPLE_A_ORDERS_ITEMS_IMPL, // feature impl (depth 3)
  ProblemException, // shared
];
