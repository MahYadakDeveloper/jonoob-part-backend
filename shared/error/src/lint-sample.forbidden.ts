// FORBIDDEN for shared/error: every other shared module and every feature
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SHARED_HTTP_SAMPLE } from '@shared/http/lint-sample';

export const FORBIDDEN = [SHARED_HTTP_SAMPLE, SAMPLE_B_API];
