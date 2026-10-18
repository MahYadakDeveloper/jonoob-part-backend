import 'reflect-metadata';

export const SCHEDULED_QUEUE = 'scheduled-jobs';
const KEY = 'scheduled-job:name';

export interface JobHandler<P = any> {
  handle(payload: P): Promise<void>;
}

/** Marks a provider as a scheduled job. The name is stored in Redis, so keep it stable. */
export const ScheduledJob =
  (name?: string): ClassDecorator =>
  (target) =>
    Reflect.defineMetadata(KEY, name ?? target.name, target);

export const scheduledJobName = (cls: Function): string | undefined =>
  Reflect.getMetadata(KEY, cls);

export const jobName = (cls: Function): string => {
  const name = scheduledJobName(cls);
  if (!name) throw new Error(`${cls.name} is missing @ScheduledJob()`);
  return name;
};

export interface ScheduledJobData {
  payload: unknown;
  runAt: string;
}

export type ScheduleArgs<H extends JobHandler> =
  Parameters<H['handle']> extends []
    ? []
    : [payload: Parameters<H['handle']>[0]];
