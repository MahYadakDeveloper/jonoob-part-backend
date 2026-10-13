export interface JobScheduler {
  schedule(date: Date, callback: () => Promise<void>): Promise<JobHandle>;

  getExecutionDate(jobId: string): Promise<Date>;

  update(jobId: string, date: Date): Promise<void>;

  cancel(jobId: string): Promise<void>;
}

export interface JobHandle {
  id: string;
  date: Date;
  cancel(): Promise<void>;
  update(date: Date): Promise<void>;
}
