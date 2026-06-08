import type { IUserRepository } from './auth/user.repository.interface';
import type { IUserStatsRepository } from './auth/user-stats.repository.interface';

export const UNIT_OF_WORK = 'UNIT_OF_WORK';

export interface IUnitOfWork {
  readonly users: IUserRepository;
  readonly userStats: IUserStatsRepository;
  withTransaction<R>(fn: (uow: IUnitOfWork) => Promise<R>): Promise<R>;
}
