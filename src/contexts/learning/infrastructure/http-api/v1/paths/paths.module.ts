import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LearningPathEntity } from 'src/contexts/shared/domain/entities/learning/learning-path.entity';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';
import { LessonEntity } from 'src/contexts/shared/domain/entities/learning/lesson.entity';
import { LessonAnswerEntity } from 'src/contexts/shared/domain/entities/learning/lesson-answer.entity';
import { PathGenerationJobEntity } from 'src/contexts/shared/domain/entities/learning/path-generation-job.entity';
import { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import { UserAuthProviderEntity } from 'src/contexts/shared/domain/entities/auth/user-auth-provider.entity';
import { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import { LEARNING_UNIT_OF_WORK } from 'src/contexts/learning/domain/unit-of-work.interface';
import { AI_PATH_GENERATOR } from 'src/contexts/learning/domain/ports/ai-path-generator.port';
import { PATH_USE_CASE } from 'src/contexts/learning/domain/contracts/i-path.use-case';
import { TypeOrmLearningUnitOfWork } from 'src/contexts/learning/infrastructure/uow/typeorm-learning-unit-of-work';
import { DeepseekPathGeneratorService } from 'src/contexts/learning/infrastructure/services/deepseek-path-generator.service';
import { PathUseCase } from 'src/contexts/learning/application/use-cases/path.use-case';
import { PathsController } from './controllers/paths.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningPathEntity,
      ChapterEntity,
      LessonEntity,
      LessonAnswerEntity,
      PathGenerationJobEntity,
      UserEntity,
      UserAuthProviderEntity,
      UserStatsEntity,
      XpLevelEntity,
    ]),
    ConfigModule,
  ],
  controllers: [PathsController],
  providers: [
    {
      provide: LEARNING_UNIT_OF_WORK,
      useClass: TypeOrmLearningUnitOfWork,
    },
    {
      provide: AI_PATH_GENERATOR,
      useClass: DeepseekPathGeneratorService,
    },
    { provide: PATH_USE_CASE, useClass: PathUseCase },
  ],
})
export class PathsModule {}
