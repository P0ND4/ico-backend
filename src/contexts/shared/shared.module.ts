import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALL_ENTITIES } from 'src/config/database.config';
import { REPOSITORY_TOKENS } from './domain/repositories/repository.tokens';
import { UNIT_OF_WORK } from './domain/repositories/unit-of-work.interface';
import { TOKEN_SERVICE } from './domain/ports/token.port';
import { TOKEN_BLACKLIST_PORT } from './domain/ports/token-blacklist.port';
import { TypeOrmUnitOfWork } from './infrastructure/repositories/typeorm-unit-of-work';
import { UserTypeOrmRepository } from './infrastructure/repositories/auth/user.typeorm.repository';
import { UserStatsTypeOrmRepository } from './infrastructure/repositories/auth/user-stats.typeorm.repository';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';
import { BlacklistService } from './infrastructure/services/blacklist.service';
import { RedisModule } from 'src/database/redis.module';

const REPOSITORY_PROVIDERS = [
  { provide: REPOSITORY_TOKENS.USER, useClass: UserTypeOrmRepository },
  {
    provide: REPOSITORY_TOKENS.USER_STATS,
    useClass: UserStatsTypeOrmRepository,
  },
];

const UNIT_OF_WORK_PROVIDER = {
  provide: UNIT_OF_WORK,
  useClass: TypeOrmUnitOfWork,
};

const TOKEN_PROVIDERS = [
  { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  { provide: TOKEN_BLACKLIST_PORT, useClass: BlacklistService },
];

@Module({
  imports: [TypeOrmModule.forFeature(ALL_ENTITIES), RedisModule],
  providers: [
    ...REPOSITORY_PROVIDERS,
    UNIT_OF_WORK_PROVIDER,
    ...TOKEN_PROVIDERS,
  ],
  exports: [...REPOSITORY_PROVIDERS, UNIT_OF_WORK_PROVIDER, ...TOKEN_PROVIDERS],
})
export class SharedModule {}
