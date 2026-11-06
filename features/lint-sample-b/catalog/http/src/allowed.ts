// ALLOWED for a submodule http: own api and shared/http
import { SAMPLE_B_CATALOG_API } from '@feature.api/lint-sample-b-catalog';
import { SHARED_HTTP_SAMPLE } from '@shared/http/lint-sample';

export const ALLOWED = [
  SAMPLE_B_CATALOG_API, // own api
  SHARED_HTTP_SAMPLE, // shared/http
];
