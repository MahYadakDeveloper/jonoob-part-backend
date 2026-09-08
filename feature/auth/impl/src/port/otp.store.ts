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
   * Create/store a new OTP challenge.
   * @param ttl in millisecond
   */
  set(key: string, record: OtpRecord, ttl: number): Promise<void>;

  /**
   * Get an OTP challenge.
   */
  get(key: string): Promise<OtpRecord | null>;

  /**
   * Remove an OTP challenge.
   */
  delete(key: string): Promise<void>;

  /**
   * Check whether an OTP challenge exists.
   */
  exists(key: string): Promise<boolean>;

  /**
   * Increase verification attempts.
   *
   * Returns the new attempt count.
   */
  incrementAttempts(key: string): Promise<number>;
}
