// FORBIDDEN for http: only own api and shared/http
import { SAMPLE_A_ORDERS_API } from '@feature.api/lint-sample-a-orders';
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SAMPLE_A_IMPL } from '@feature.impl/lint-sample-a';
import { hmacSha256 } from '@infra/crypto/hmac';
import { ProblemException } from '@shared/error';
import { SHARED_WS_SAMPLE } from '@shared/ws/lint-sample';

export const FORBIDDEN = [
  SAMPLE_A_IMPL, // own impl
  SAMPLE_A_ORDERS_API, // child api (own api only)
  SAMPLE_B_API, // api of another feature
  ProblemException, // shared/error (http layer gets shared/http only)
  SHARED_WS_SAMPLE, // shared/ws
  hmacSha256, // infrastructure
];
