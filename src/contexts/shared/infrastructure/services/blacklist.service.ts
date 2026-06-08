import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { BLACKLIST_TTL_SECONDS } from 'src/contexts/shared/constants/jwt.constants';
import type { ITokenBlacklistPort } from 'src/contexts/shared/domain/ports/token-blacklist.port';

@Injectable()
export class BlacklistService implements ITokenBlacklistPort {
  private readonly KEY_PREFIX = 'blacklist:';

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async add(token: string, ttlSeconds = BLACKLIST_TTL_SECONDS): Promise<void> {
    await this.redis.setex(`${this.KEY_PREFIX}${token}`, ttlSeconds, 'revoked');
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return (await this.redis.get(`${this.KEY_PREFIX}${token}`)) !== null;
  }
}
