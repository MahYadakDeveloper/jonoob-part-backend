// ALLOWED for an app: itself, any feature layer, infrastructure and shared
import { SAMPLE_B_CATALOG_VARIANTS_API } from '@feature.api/lint-sample-b-catalog-variants';
import { SAMPLE_A_HTTP } from '@feature.http/lint-sample-a';
import { SAMPLE_A_ORDERS_IMPL } from '@feature.impl/lint-sample-a-orders';
import { hmacSha256 } from '@infra/crypto/hmac';
import { ProblemException } from '@shared/error';
import { APP_LINT_SAMPLE } from './index';

export const ALLOWED = [
  APP_LINT_SAMPLE, // same app
  SAMPLE_A_ORDERS_IMPL, // feature impl (any depth)
  SAMPLE_A_HTTP, // feature http
  SAMPLE_B_CATALOG_VARIANTS_API, // feature api (any depth)
  hmacSha256, // infrastructure
  ProblemException, // shared
];
