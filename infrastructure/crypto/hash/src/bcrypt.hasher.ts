export class BcryptHasher {
  constructor(private readonly cost: number) {}

  async hash(value: string): Promise<string> {
    return await Bun.password.hash(value, {
      algorithm: 'bcrypt',
      cost: this.cost,
    });
  }

  async verify(value: string, hash: string): Promise<boolean> {
    return await Bun.password.verify(value, hash, 'bcrypt');
  }
}
