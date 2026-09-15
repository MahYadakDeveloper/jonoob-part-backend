export interface OtpRecord {
  /**
   * Hashed OTP value.
   *
   * Never store the raw OTP.
   */
  hash: string;
}

export interface OtpStore {
  /**
   * Store a value.
   *
   * @param ttl Time-to-live in seconds.
   */
  set(key: string, value: OtpRecord, ttl?: number): Promise<void>;

  get(key: string): Promise<OtpRecord | null>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}
