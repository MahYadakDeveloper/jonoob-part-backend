export interface RetentionRepository {
  deleteOlderThan(date: Date): Promise<void>;
}

export interface RetentionSettings {
  get(key: string): Promise<Duration>;
}

@Injectable()
export class RetentionService {
  constructor(private readonly settings: RetentionSettings) {}

  async purge(
    settingKey: string,
    repository: RetentionRepository,
  ): Promise<void> {
    const duration = await this.settings.get(settingKey);
    const cutoff = subtractDuration(new Date(), duration);

    await repository.deleteOlderThan(cutoff);
  }
}
