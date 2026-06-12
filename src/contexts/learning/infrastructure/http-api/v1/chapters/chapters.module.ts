import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LearningPathEntity } from 'src/contexts/shared/domain/entities/learning/learning-path.entity';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';
import { LessonEntity } from 'src/contexts/shared/domain/entities/learning/lesson.entity';
import { LessonAnswerEntity } from 'src/contexts/shared/domain/entities/learning/lesson-answer.entity';
import { PathGenerationJobEntity } from 'src/contexts/shared/domain/entities/learning/path-generation-job.entity';
import { ExamResultEntity } from 'src/contexts/shared/domain/entities/learning/exam-result.entity';
import { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import { UserAuthProviderEntity } from 'src/contexts/shared/domain/entities/auth/user-auth-provider.entity';
import { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import { SubscriptionPlanEntity } from 'src/contexts/shared/domain/entities/config/subscription-plan.entity';
import { LEARNING_UNIT_OF_WORK } from 'src/contexts/learning/domain/unit-of-work.interface';
import { CHAPTER_USE_CASE } from 'src/contexts/learning/domain/contracts/i-chapter.use-case';
import { EXAM_USE_CASE } from 'src/contexts/learning/domain/contracts/i-exam.use-case';
import { TypeOrmLearningUnitOfWork } from 'src/contexts/learning/infrastructure/uow/typeorm-learning-unit-of-work';
import { ChapterUseCase } from 'src/contexts/learning/application/use-cases/chapter.use-case';
import { ExamUseCase } from 'src/contexts/learning/application/use-cases/exam.use-case';
import { ChaptersController } from './controllers/chapters.controller';

@Module({
  imports: [
    ConfigModule,
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
      SubscriptionPlanEntity,
      ExamResultEntity,
    ]),
  ],
  controllers: [ChaptersController],
  providers: [
    {
      provide: LEARNING_UNIT_OF_WORK,
      useClass: TypeOrmLearningUnitOfWork,
    },
    { provide: CHAPTER_USE_CASE, useClass: ChapterUseCase },
    { provide: EXAM_USE_CASE, useClass: ExamUseCase },
  ],
})
export class ChaptersModule {}
