// FORBIDDEN for ws: only own api and shared/ws
import { SAMPLE_A_HTTP } from '@feature.http/lint-sample-a';
import { SAMPLE_A_IMPL } from '@feature.impl/lint-sample-a';
import { ProblemException } from '@shared/error';
import { SHARED_HTTP_SAMPLE } from '@shared/http/lint-sample';

export const FORBIDDEN = [
  SAMPLE_A_IMPL, // own impl
  SAMPLE_A_HTTP, // another layer (http)
  SHARED_HTTP_SAMPLE, // shared/http
  ProblemException, // shared/error
];
