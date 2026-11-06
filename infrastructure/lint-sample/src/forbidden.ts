// FORBIDDEN for infrastructure: feature api/http/ws, apps, other infrastructure
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SAMPLE_A_HTTP } from '@feature.http/lint-sample-a';
import { SAMPLE_A_WS } from '@feature.ws/lint-sample-a';
import { APP_LINT_SAMPLE } from '@app/lint-sample';
import { hmacSha256 } from '@infra/crypto/hmac';

export const FORBIDDEN = [
  SAMPLE_B_API, // feature api (impl only)
  SAMPLE_A_HTTP, // feature http
  SAMPLE_A_WS, // feature ws
  APP_LINT_SAMPLE, // app
  hmacSha256, // other infrastructure
];
