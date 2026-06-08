import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';
import { UserAuthProviderEntity } from 'src/contexts/shared/domain/entities/auth/user-auth-provider.entity';
import { AuthModule } from './http-api/v1/auth/auth.module';
import { UsersModule } from './http-api/v1/users/users.module';
import { StatsModule } from './http-api/v1/stats/stats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserStatsEntity, UserAuthProviderEntity]),
    AuthModule,
    UsersModule,
    StatsModule,
  ],
})
export class UserModule {}
