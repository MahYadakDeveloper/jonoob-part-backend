// FORBIDDEN for shared/http: other shared modules and features
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SHARED_WS_SAMPLE } from '@shared/ws/lint-sample';

export const FORBIDDEN = [
  SHARED_WS_SAMPLE, // http -> ws
  SAMPLE_B_API, // feature api
];
