import { Module } from '@nestjs/common';
import { SharedModule } from 'src/contexts/shared/shared.module';
import { UserProfileUseCase } from '../../../../application/use-cases/user-profile.use-case';
import { USER_PROFILE_USE_CASE } from '../../../../domain/contracts/i-user-profile.use-case';
import { StatsController } from './controllers/stats.controller';

@Module({
  imports: [SharedModule],
  providers: [{ provide: USER_PROFILE_USE_CASE, useClass: UserProfileUseCase }],
  controllers: [StatsController],
})
export class StatsModule {}
