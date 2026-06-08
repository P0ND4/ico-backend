import type { ILearningPathRepository } from './ports/learning-path.repository.port';
import type { IChapterRepository } from './ports/chapter.repository.port';
import type { ILessonRepository } from './ports/lesson.repository.port';
import type { ILessonAnswerRepository } from './ports/lesson-answer.repository.port';
import type { IPathGenerationJobRepository } from './ports/path-generation-job.repository.port';
import type { IUserRepository } from 'src/contexts/shared/domain/repositories/auth/user.repository.interface';
import type { IUserStatsRepository } from 'src/contexts/shared/domain/repositories/auth/user-stats.repository.interface';
import type { IXpLevelRepository } from 'src/contexts/shared/domain/repositories/config/xp-level.repository.interface';

export const LEARNING_UNIT_OF_WORK = 'LEARNING_UNIT_OF_WORK';

export interface ILearningUnitOfWork {
  readonly paths: ILearningPathRepository;
  readonly chapters: IChapterRepository;
  readonly lessons: ILessonRepository;
  readonly lessonAnswers: ILessonAnswerRepository;
  readonly generationJobs: IPathGenerationJobRepository;
  readonly users: IUserRepository;
  readonly userStats: IUserStatsRepository;
  readonly xpLevels: IXpLevelRepository;
  withTransaction<R>(fn: (uow: ILearningUnitOfWork) => Promise<R>): Promise<R>;
}
