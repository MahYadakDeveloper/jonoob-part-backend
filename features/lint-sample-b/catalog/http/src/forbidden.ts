// FORBIDDEN for a submodule http: only its own api and shared/http
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SAMPLE_B_CATALOG_IMPL } from '@feature.impl/lint-sample-b-catalog';
import { SHARED_WS_SAMPLE } from '@shared/ws/lint-sample';

export const FORBIDDEN = [
  SAMPLE_B_API, // parent api (own api only)
  SAMPLE_B_CATALOG_IMPL, // own impl
  SHARED_WS_SAMPLE, // shared/ws
];
