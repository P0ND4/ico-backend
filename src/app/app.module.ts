import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { minutes, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from 'src/config/database.config';
import { DomainExceptionFilter } from 'src/contexts/shared/infrastructure/filters/domain-exception.filter';
import { JwtAuthGuard } from 'src/contexts/shared/guards/jwt-auth.guard';
import { ApiResponseInterceptor } from 'src/contexts/shared/interceptors/api.response.interceptor';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { UserModule } from 'src/contexts/user/infrastructure/main.module';
import { LearningModule } from 'src/contexts/learning/infrastructure/main.module';
import { TutorModule } from 'src/contexts/tutor/infrastructure/main.module';
import { ContentModule } from 'src/contexts/content/infrastructure/main.module';
import { PlanningModule } from 'src/contexts/planning/infrastructure/main.module';
import { CatalogContextModule } from 'src/contexts/catalog/infrastructure/main.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from 'src/database/redis.module';
import { SeederService } from 'src/app/seeds/seeder.service';
import { CleanupService } from 'src/app/cleanup/cleanup.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    RedisModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: ['REDIS_CLIENT'],
      useFactory: (redisThrottler) => ({
        throttlers: [{ ttl: minutes(30), limit: 700 }],
        storage: new ThrottlerStorageRedisService(redisThrottler),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    SharedModule,
    UserModule,
    LearningModule,
    TutorModule,
    ContentModule,
    PlanningModule,
    CatalogContextModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    SeederService,
    CleanupService,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
