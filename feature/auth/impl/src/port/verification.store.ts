export interface Verification {
  id: string;
  phoneNumber: string;
}

export interface VerificationStore {
  /**
   * Store a successful verification temporarily.
   */
  set(verification: Verification, ttlSeconds: number): Promise<void>;

  /**
   * Get a verification without consuming it.
   */
  get(id: string): Promise<Verification | null>;

  /**
   * Get and remove the verification atomically.
   *
   * Useful when sign-in/sign-up consumes the verification.
   */
  consume(id: string): Promise<Verification | null>;

  /**
   * Remove a verification explicitly.
   */
  delete(id: string): Promise<void>;
}
