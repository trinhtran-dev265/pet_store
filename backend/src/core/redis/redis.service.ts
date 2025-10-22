import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisKey } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly cfg: ConfigService) {
    const url = cfg.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }

  getClient() {
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string | string[]) {
    if (Array.isArray(key)) {
      return this.client.del(...(key as RedisKey[]));
    }
    return this.client.del(key as RedisKey);
  }

  async deleteByPattern(pattern: string) {
    const stream = this.client.scanStream({ match: pattern, count: 500 });
    const keys: string[] = [];

    return new Promise<void>((resolve, reject) => {
      stream.on('data', (resultKeys: string[]) => {
        if (resultKeys.length) keys.push(...resultKeys);
      });

      stream.on('end', () => {
        void (async () => {
          if (keys.length) await this.client.del(...(keys as RedisKey[]));
          resolve();
        })();
      });

      stream.on('error', reject);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
