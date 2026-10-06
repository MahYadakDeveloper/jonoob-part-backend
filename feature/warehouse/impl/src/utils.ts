import { PageCriteria } from '@infra/db-drizzle';
import { z } from 'zod';

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OmitPartials<T, Except extends keyof T = never> = Pick<
  T,
  RequiredKeys<T> | Except
>;
