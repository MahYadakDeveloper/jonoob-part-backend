// ALLOWED for http: own api, shared/http and any external package
import { SAMPLE_A_API } from '@feature.api/lint-sample-a';
import { SHARED_HTTP_SAMPLE } from '@shared/http/lint-sample';
import { Controller } from '@nestjs/common';

export const ALLOWED = [
  SAMPLE_A_API, // own api
  SHARED_HTTP_SAMPLE, // shared/http
  Controller, // external (free outside impl)
];
