import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

const createRedisClient = (
  config: ConfigService,
  clientName: string,
): Redis => {
  const redisUrl = config.get<string>('REDIS_URL');
  const host = config.get<string>('REDIS_HOST', 'localhost');
  const port = config.get<number>('REDIS_PORT', 6379);
  const password = config.get<string>('REDIS_PASSWORD');
  const username = config.get<string>('REDIS_USERNAME');

  const client = redisUrl
    ? new Redis(redisUrl, {
        lazyConnect: false,
        maxRetriesPerRequest: 3,
      })
    : new Redis({
        host,
        port,
        password,
        username,
        lazyConnect: false,
        maxRetriesPerRequest: 3,
      });

  client.on('error', (err) => {
    console.error(`[${clientName}] Connection error:`, err.message);
  });

  client.on('connect', () => {
    const connectionString = redisUrl || `${host}:${port}`;
    console.log(`[${clientName}] Connected to ${connectionString}`);
  });

  return client;
};

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createRedisClient(config, 'Redis Client'),
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
