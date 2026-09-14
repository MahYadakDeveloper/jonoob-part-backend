import { Store } from './store';

export interface OtpRecord {
  /**
   * Hashed OTP value.
   *
   * Never store the raw OTP.
   */
  hash: string;
}

export interface OtpStore extends Store<OtpRecord> {}
