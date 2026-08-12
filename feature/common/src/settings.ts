import { z } from 'zod';
export interface SettingsStore {
  get<T>(token: SettingToken<T>): Promise<T>;
  set<T>(token: SettingToken<T>, value: T): Promise<void>;
}

export interface SettingToken<T> {
  readonly key: string;
  readonly defaultValue: T;
  readonly schema: z.ZodType<T>;
}
