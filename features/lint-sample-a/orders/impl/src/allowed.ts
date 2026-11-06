// ALLOWED for impl (modulePath: lint-sample-a/orders)
import { SAMPLE_A_BILLING_API } from '@feature.api/lint-sample-a-billing';
import { SAMPLE_A_ORDERS_API } from '@feature.api/lint-sample-a-orders';
import { SAMPLE_A_ORDERS_ITEMS_API } from '@feature.api/lint-sample-a-orders-items';
import { SAMPLE_B_API } from '@feature.api/lint-sample-b';
import { ProblemException } from '@shared/error';
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SAMPLE_A_ORDERS_IMPL } from './index';

export const ALLOWED = [
  SAMPLE_A_ORDERS_IMPL, // same package
  SAMPLE_A_ORDERS_API, // own api
  SAMPLE_A_ORDERS_ITEMS_API, // child api (one level lower)
  SAMPLE_A_BILLING_API, // sibling api (same parent)
  SAMPLE_B_API, // root api of another feature
  ProblemException, // shared/error
  Injectable, // external: @nestjs/common
  eq, // external: drizzle-*
];
