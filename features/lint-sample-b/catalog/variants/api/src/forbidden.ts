// FORBIDDEN for a depth-3 api: nothing but its own package (and externals)
import { SAMPLE_A_API } from '@feature.api/lint-sample-a';
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { SAMPLE_B_CATALOG_API } from '@feature.api/lint-sample-b-catalog';

export const FORBIDDEN = [
  SAMPLE_B_CATALOG_API, // parent api
  SAMPLE_B_API, // grandparent api
  SAMPLE_A_API, // api of another feature
];
