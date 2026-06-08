import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { LESSON_USE_CASE } from 'src/contexts/learning/domain/contracts/i-lesson.use-case';
import { TypeOrmLearningUnitOfWork } from 'src/contexts/learning/infrastructure/uow/typeorm-learning-unit-of-work';
import { LessonUseCase } from 'src/contexts/learning/application/use-cases/lesson.use-case';
import { LessonsController } from './controllers/lessons.controller';

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
  ],
  controllers: [LessonsController],
  providers: [
    {
      provide: LEARNING_UNIT_OF_WORK,
      useClass: TypeOrmLearningUnitOfWork,
    },
    { provide: LESSON_USE_CASE, useClass: LessonUseCase },
  ],
})
export class LessonsModule {}
