// FORBIDDEN for impl (modulePath: lint-sample-a/orders)
import { SAMPLE_A_API } from '@feature.api/lint-sample-a';
import { SAMPLE_B_CATALOG_API } from '@feature.api/lint-sample-b-catalog';
import { SAMPLE_B_CATALOG_VARIANTS_API } from '@feature.api/lint-sample-b-catalog-variants';
import { SAMPLE_A_HTTP } from '@feature.http/lint-sample-a';
import { SAMPLE_A_IMPL } from '@feature.impl/lint-sample-a';
import { SAMPLE_A_BILLING_IMPL } from '@feature.impl/lint-sample-a-billing';
import { SAMPLE_A_ORDERS_ITEMS_IMPL } from '@feature.impl/lint-sample-a-orders-items';
import { SAMPLE_B_IMPL } from '@feature.impl/lint-sample-b';
import { hmacSha256 } from '@infra/crypto/hmac';
import { SHARED_HTTP_SAMPLE } from '@shared/http/lint-sample';
import { SHARED_WS_SAMPLE } from '@shared/ws/lint-sample';
import { FastifyRequest } from 'fastify';
import { join } from 'node:path';

export const FORBIDDEN = [
  SAMPLE_A_API, // parent api (never anything above)
  SAMPLE_A_IMPL, // parent impl
  SAMPLE_A_HTTP, // another layer (http)
  SAMPLE_A_BILLING_IMPL, // sibling impl (api only)
  SAMPLE_A_ORDERS_ITEMS_IMPL, // child impl (api only)
  SAMPLE_B_IMPL, // impl of another feature
  SAMPLE_B_CATALOG_API, // submodule api of another feature
  SAMPLE_B_CATALOG_VARIANTS_API, // depth-3 api of another feature
  hmacSha256, // infrastructure
  SHARED_HTTP_SAMPLE, // shared/http (impl may use utils/types/error only)
  SHARED_WS_SAMPLE, // shared/ws
  join, // external core module: node:path
  (_request: FastifyRequest) => undefined, // external: fastify (not whitelisted)
];
