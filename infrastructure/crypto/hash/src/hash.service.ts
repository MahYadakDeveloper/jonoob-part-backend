import bcrypt from 'bcrypt';

export class HashService {
  constructor(private readonly rounds: number) {}

  async hash(value: string): Promise<string> {
    return await bcrypt.hash(value, this.rounds);
  }

  async verify(value: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(value, hash);
  }
}
