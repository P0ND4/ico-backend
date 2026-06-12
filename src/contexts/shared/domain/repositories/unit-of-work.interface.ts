import type { IUserRepository } from './auth/user.repository.interface';
import type { IUserStatsRepository } from './auth/user-stats.repository.interface';
import type { IXpLevelRepository } from './config/xp-level.repository.interface';
import type { ISubscriptionPlanRepository } from './config/subscription-plan.repository.interface';
import type { IDeviceTrialRepository } from './auth/device-trial.repository.interface';
import type { IUserPlanQuotaRepository } from './auth/user-plan-quota.repository.interface';

export const UNIT_OF_WORK = 'UNIT_OF_WORK';

export interface IUnitOfWork {
  readonly users: IUserRepository;
  readonly userStats: IUserStatsRepository;
  readonly xpLevels: IXpLevelRepository;
  readonly subscriptionPlans: ISubscriptionPlanRepository;
  readonly deviceTrials: IDeviceTrialRepository;
  readonly userPlanQuotas: IUserPlanQuotaRepository;
  withTransaction<R>(fn: (uow: IUnitOfWork) => Promise<R>): Promise<R>;
}
