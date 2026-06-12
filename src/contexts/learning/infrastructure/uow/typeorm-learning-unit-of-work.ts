import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { LearningPathEntity } from 'src/contexts/shared/domain/entities/learning/learning-path.entity';
import { ChapterEntity } from 'src/contexts/shared/domain/entities/learning/chapter.entity';
import { LessonEntity } from 'src/contexts/shared/domain/entities/learning/lesson.entity';
import { LessonAnswerEntity } from 'src/contexts/shared/domain/entities/learning/lesson-answer.entity';
import { PathGenerationJobEntity } from 'src/contexts/shared/domain/entities/learning/path-generation-job.entity';
import { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import { UserAuthProviderEntity } from 'src/contexts/shared/domain/entities/auth/user-auth-provider.entity';
import { UserStatsEntity } from 'src/contexts/shared/domain/entities/auth/user-stats.entity';
import { XpLevelEntity } from 'src/contexts/shared/domain/entities/config/xp-level.entity';
import { SubscriptionPlanEntity } from 'src/contexts/shared/domain/entities/config/subscription-plan.entity';
import { LearningPathTypeOrmRepository } from '../repositories/learning-path.typeorm.repository';
import { ChapterTypeOrmRepository } from '../repositories/chapter.typeorm.repository';
import { LessonTypeOrmRepository } from '../repositories/lesson.typeorm.repository';
import { LessonAnswerTypeOrmRepository } from '../repositories/lesson-answer.typeorm.repository';
import { PathGenerationJobTypeOrmRepository } from '../repositories/path-generation-job.typeorm.repository';
import { UserTypeOrmRepository } from 'src/contexts/shared/infrastructure/repositories/auth/user.typeorm.repository';
import { UserStatsTypeOrmRepository } from 'src/contexts/shared/infrastructure/repositories/auth/user-stats.typeorm.repository';
import { XpLevelTypeOrmRepository } from 'src/contexts/shared/infrastructure/repositories/config/xp-level.typeorm.repository';
import { SubscriptionPlanTypeOrmRepository } from 'src/contexts/shared/infrastructure/repositories/config/subscription-plan.typeorm.repository';
import type { ILearningUnitOfWork } from '../../domain/unit-of-work.interface';
import type { ILearningPathRepository } from '../../domain/ports/learning-path.repository.port';
import type { IChapterRepository } from '../../domain/ports/chapter.repository.port';
import type { ILessonRepository } from '../../domain/ports/lesson.repository.port';
import type { ILessonAnswerRepository } from '../../domain/ports/lesson-answer.repository.port';
import type { IPathGenerationJobRepository } from '../../domain/ports/path-generation-job.repository.port';
import type { IUserRepository } from 'src/contexts/shared/domain/repositories/auth/user.repository.interface';
import type { IUserStatsRepository } from 'src/contexts/shared/domain/repositories/auth/user-stats.repository.interface';
import type { IXpLevelRepository } from 'src/contexts/shared/domain/repositories/config/xp-level.repository.interface';
import type { ISubscriptionPlanRepository } from 'src/contexts/shared/domain/repositories/config/subscription-plan.repository.interface';

@Injectable()
export class TypeOrmLearningUnitOfWork implements ILearningUnitOfWork {
  readonly paths: ILearningPathRepository;
  readonly chapters: IChapterRepository;
  readonly lessons: ILessonRepository;
  readonly lessonAnswers: ILessonAnswerRepository;
  readonly generationJobs: IPathGenerationJobRepository;
  readonly users: IUserRepository;
  readonly userStats: IUserStatsRepository;
  readonly xpLevels: IXpLevelRepository;
  readonly subscriptionPlans: ISubscriptionPlanRepository;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(LearningPathEntity)
    pathRepo: Repository<LearningPathEntity>,
    @InjectRepository(ChapterEntity) chapterRepo: Repository<ChapterEntity>,
    @InjectRepository(LessonEntity) lessonRepo: Repository<LessonEntity>,
    @InjectRepository(LessonAnswerEntity)
    answerRepo: Repository<LessonAnswerEntity>,
    @InjectRepository(PathGenerationJobEntity)
    jobRepo: Repository<PathGenerationJobEntity>,
    @InjectRepository(UserEntity) userRepo: Repository<UserEntity>,
    @InjectRepository(UserAuthProviderEntity)
    authProviderRepo: Repository<UserAuthProviderEntity>,
    @InjectRepository(UserStatsEntity) statsRepo: Repository<UserStatsEntity>,
    @InjectRepository(XpLevelEntity) xpRepo: Repository<XpLevelEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    subscriptionPlanRepo: Repository<SubscriptionPlanEntity>,
  ) {
    this.paths = new LearningPathTypeOrmRepository(pathRepo);
    this.chapters = new ChapterTypeOrmRepository(chapterRepo);
    this.lessons = new LessonTypeOrmRepository(lessonRepo);
    this.lessonAnswers = new LessonAnswerTypeOrmRepository(answerRepo);
    this.generationJobs = new PathGenerationJobTypeOrmRepository(jobRepo);
    this.users = new UserTypeOrmRepository(
      userRepo,
      authProviderRepo,
      dataSource,
    );
    this.userStats = new UserStatsTypeOrmRepository(statsRepo);
    this.xpLevels = new XpLevelTypeOrmRepository(xpRepo);
    this.subscriptionPlans = new SubscriptionPlanTypeOrmRepository(subscriptionPlanRepo);
  }

  async withTransaction<R>(
    fn: (uow: ILearningUnitOfWork) => Promise<R>,
  ): Promise<R> {
    return this.dataSource.transaction((manager) =>
      fn(this.buildTransactional(manager)),
    );
  }

  private buildTransactional(manager: EntityManager): ILearningUnitOfWork {
    const tx: ILearningUnitOfWork = {
      paths: new LearningPathTypeOrmRepository(
        manager.getRepository(LearningPathEntity),
      ),
      chapters: new ChapterTypeOrmRepository(
        manager.getRepository(ChapterEntity),
      ),
      lessons: new LessonTypeOrmRepository(manager.getRepository(LessonEntity)),
      lessonAnswers: new LessonAnswerTypeOrmRepository(
        manager.getRepository(LessonAnswerEntity),
      ),
      generationJobs: new PathGenerationJobTypeOrmRepository(
        manager.getRepository(PathGenerationJobEntity),
      ),
      users: new UserTypeOrmRepository(
        manager.getRepository(UserEntity),
        manager.getRepository(UserAuthProviderEntity),
        this.dataSource,
      ),
      userStats: new UserStatsTypeOrmRepository(
        manager.getRepository(UserStatsEntity),
      ),
      xpLevels: new XpLevelTypeOrmRepository(
        manager.getRepository(XpLevelEntity),
      ),
      subscriptionPlans: new SubscriptionPlanTypeOrmRepository(
        manager.getRepository(SubscriptionPlanEntity),
      ),
      withTransaction: <T>(innerFn: (uow: ILearningUnitOfWork) => Promise<T>) =>
        innerFn(tx),
    };
    return tx;
  }
}
