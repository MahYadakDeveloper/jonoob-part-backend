import { z } from 'zod';

export interface SettingToken<T> {
  readonly key: string;
  readonly defaultValue: T;
  readonly schema: z.ZodType<T>;
}
