import { ISynchronizer } from "@feature/warehouse";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import Redlock from "redlock";

@Injectable()
export class RedlockSynchronizer implements ISynchronizer {
  private readonly redlock: Redlock;

  /**
   * TODO: Use env variable for redis connection
   */
  constructor(private readonly config: ConfigService) {
    // By default, it will connect to localhost:6379.
    const redis = new Redis();
    this.redlock = new Redlock(redis)
  }

  async executeExclusive<T>(
    key: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    // Acquire a lock.
    let lock = await this.redlock.acquire(["a"], 5000);
    try {
      return await callback();

      // Extend the lock. Note that this returns a new `Lock` instance.
      // lock = await lock.extend(5000);

      // Do something else...
      // await somethingElse();
    } finally {
      // Release the lock.
      await lock.release();
    }
  }
}
