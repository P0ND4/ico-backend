import type { UserPlanQuotaEntity } from '../../entities/auth/user-plan-quota.entity';

export interface IUserPlanQuotaRepository {
  findByUserId(userId: string): Promise<UserPlanQuotaEntity | null>;
  ensureUserRecord(userId: string): Promise<UserPlanQuotaEntity>;
  resetPeriod(userId: string): Promise<UserPlanQuotaEntity>;
  incrementTutorUse(userId: string): Promise<UserPlanQuotaEntity>;
  incrementSummaryUse(userId: string): Promise<UserPlanQuotaEntity>;
  incrementStandardPathUse(userId: string): Promise<UserPlanQuotaEntity>;
  incrementDeepPathUse(userId: string): Promise<UserPlanQuotaEntity>;
}
