// FORBIDDEN for shared/ws: other shared modules, features, infrastructure, apps
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SAMPLE_B_IMPL } from '@feature.impl/lint-sample-b';
import { hmacSha256 } from '@infra/crypto/hmac';
import { APP_LINT_SAMPLE } from '@app/lint-sample';
import { SHARED_HTTP_SAMPLE } from '@shared/http/lint-sample';

export const FORBIDDEN = [
  SHARED_HTTP_SAMPLE, // ws -> http
  SAMPLE_B_API, // feature api
  SAMPLE_B_IMPL, // feature impl
  hmacSha256, // infrastructure
  APP_LINT_SAMPLE, // app
];
