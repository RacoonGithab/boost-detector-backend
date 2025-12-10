import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get('REDIS_HOST') as string;
    const port = parseInt(this.configService.get('REDIS_PORT') as string, 10);

    this.redisClient = new Redis({
      host: host,
      port: port,
      retryStrategy: times => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

  }

  onModuleInit() {
    this.redisClient.on('connect', () => {
    });
  }

  async onModuleDestroy() {
    return this.redisClient.disconnect(false);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setex(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.redisClient.zadd(key, score, member);
    const ttl = await this.redisClient.ttl(key);
    if (ttl === -1) {
      await this.redisClient.expire(key, 300);
    }
  }

  async zremrangebyscore(key: string, min: number, max: number): Promise<void> {
    await this.redisClient.zremrangebyscore(key, min, max);
  }

  async zscore(key: string, member: string): Promise<number | null> {
    const score = await this.redisClient.zscore(key, member);
    return score ? parseFloat(score) : null;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds);
  }
}
