export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

export type BunPasswordHasherOptions =
  | { algorithm: 'bcrypt'; cost: number }
  | { algorithm: 'argon2id'; memoryCost?: number; timeCost?: number };

export class BunPasswordHasher implements PasswordHasher {
  constructor(private readonly options: BunPasswordHasherOptions) {}

  hash(plain: string): Promise<string> {
    return Bun.password.hash(plain, this.options);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    return Bun.password.verify(plain, hash);
  }
}
