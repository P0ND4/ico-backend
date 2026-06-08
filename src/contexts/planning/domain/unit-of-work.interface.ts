import type { ITaskRepository } from './ports/task.repository.port';
import type { IPomodoroSessionRepository } from './ports/pomodoro-session.repository.port';
import type { IPomodoroPresetRepository } from './ports/pomodoro-preset.repository.port';
import type { IUserStatsRepository } from 'src/contexts/shared/domain/repositories/auth/user-stats.repository.interface';

export const PLANNING_UNIT_OF_WORK = 'PLANNING_UNIT_OF_WORK';

export interface IPlanningUnitOfWork {
  readonly tasks: ITaskRepository;
  readonly sessions: IPomodoroSessionRepository;
  readonly presets: IPomodoroPresetRepository;
  readonly userStats: IUserStatsRepository;
  withTransaction<R>(fn: (uow: IPlanningUnitOfWork) => Promise<R>): Promise<R>;
}
