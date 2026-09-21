import type { UserEntity } from '../entities/auth/user.entity';
import type { SubscriptionPlanEntity } from '../entities/config/subscription-plan.entity';
import type { IUnitOfWork } from '../repositories/unit-of-work.interface';
import {
  assertPathGeneration,
  assertPlanFeature,
  EMPTY_QUOTA_BONUS,
  getEffectiveFeatureLimit,
  getEffectivePathLimit,
  getRemainingFromPlan,
  hasUnlimitedPlanAccess,
  isTrialSlotBlocked,
  type PathMode,
  type PlanFeature,
  type QuotaBonus,
  type TrialUsage,
} from './plan-guard';
import { incrementQuotaUsage, resolveQuotaUsage } from './quota-usage.helper';
import { resolveEffectiveAccess } from './access-expiry.helper';

export type { TrialUsage, PlanFeature, PathMode, QuotaBonus };

export interface TrialQuotaProfile {
  trialTutorRemaining: number | null;
  trialSummaryRemaining: number | null;
  trialStandardPathRemaining: number | null;
  trialDeepPathRemaining: number | null;
  tutorRequestLimit: number | null;
  summaryRequestLimit: number | null;
  standardPathLimit: number | null;
  deepPathLimit: number | null;
  quotaRenewsAt: Date | null;
  trialExhausted: boolean;
  bonusTutorRemaining: number;
  bonusSummaryRemaining: number;
  bonusStandardPathRemaining: number;
  bonusDeepPathRemaining: number;
  hasQuotaBonus: boolean;
}

export async function loadTrialUsage(
  uow: IUnitOfWork,
  user: UserEntity,
  plan?: SubscriptionPlanEntity | null,
): Promise<TrialUsage> {
  const resolvedPlan = plan ?? (await resolveEffectiveAccess(uow, user)).plan;
  const resolved = await resolveQuotaUsage(uow, user, resolvedPlan);
  return resolved.usage;
}

type TrialQuotaBody = Omit<
  TrialQuotaProfile,
  | 'quotaRenewsAt'
  | 'trialExhausted'
  | 'bonusTutorRemaining'
  | 'bonusSummaryRemaining'
  | 'bonusStandardPathRemaining'
  | 'bonusDeepPathRemaining'
  | 'hasQuotaBonus'
>;

export function computeTrialExhausted(
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
  quota: TrialQuotaBody,
): boolean {
  if (hasUnlimitedPlanAccess(user, plan)) return false;
  if (isTrialSlotBlocked(user, plan)) return true;

  const remainings = [
    quota.trialTutorRemaining,
    quota.trialSummaryRemaining,
    quota.trialStandardPathRemaining,
    quota.trialDeepPathRemaining,
  ].filter((value): value is number => value !== null);

  if (remainings.length === 0) return false;
  return remainings.every((value) => value === 0);
}

export function buildTrialQuotaForProfile(
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
  usage: TrialUsage,
  quotaRenewsAt: Date | null = null,
  bonus: QuotaBonus = EMPTY_QUOTA_BONUS,
): TrialQuotaProfile {
  const bonusBody = {
    bonusTutorRemaining: bonus.tutorRemaining,
    bonusSummaryRemaining: bonus.summaryRemaining,
    bonusStandardPathRemaining: bonus.standardPathRemaining,
    bonusDeepPathRemaining: bonus.deepPathRemaining,
    hasQuotaBonus:
      bonus.tutorRemaining +
        bonus.summaryRemaining +
        bonus.standardPathRemaining +
        bonus.deepPathRemaining >
      0,
  };

  // Device trial slot is anti-abuse and orthogonal to coupons: a bonus never
  // lifts that block.
  if (isTrialSlotBlocked(user, plan)) {
    const blocked: TrialQuotaBody = {
      trialTutorRemaining: 0,
      trialSummaryRemaining: 0,
      trialStandardPathRemaining: 0,
      trialDeepPathRemaining: 0,
      tutorRequestLimit: getEffectiveFeatureLimit(plan, 'tutor', bonus),
      summaryRequestLimit: getEffectiveFeatureLimit(plan, 'summary', bonus),
      standardPathLimit: getEffectivePathLimit(plan, 'standard', bonus),
      deepPathLimit: getEffectivePathLimit(plan, 'deep', bonus),
    };
    return {
      ...blocked,
      ...bonusBody,
      quotaRenewsAt,
      trialExhausted: true,
    };
  }

  const remaining = getRemainingFromPlan(plan, usage, bonus);
  const quotaBody: TrialQuotaBody = {
    trialTutorRemaining: remaining.tutorRemaining,
    trialSummaryRemaining: remaining.summaryRemaining,
    trialStandardPathRemaining: remaining.standardPathRemaining,
    trialDeepPathRemaining: remaining.deepPathRemaining,
    tutorRequestLimit: getEffectiveFeatureLimit(plan, 'tutor', bonus),
    summaryRequestLimit: getEffectiveFeatureLimit(plan, 'summary', bonus),
    standardPathLimit: getEffectivePathLimit(plan, 'standard', bonus),
    deepPathLimit: getEffectivePathLimit(plan, 'deep', bonus),
  };

  return {
    ...quotaBody,
    ...bonusBody,
    quotaRenewsAt,
    trialExhausted: computeTrialExhausted(user, plan, quotaBody),
  };
}

export async function resolveTrialQuotaForProfile(
  uow: IUnitOfWork,
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
): Promise<TrialQuotaProfile> {
  const resolved = await resolveQuotaUsage(uow, user, plan);
  return buildTrialQuotaForProfile(
    user,
    plan,
    resolved.usage,
    resolved.quotaRenewsAt,
    resolved.bonus,
  );
}

export async function assertFeatureWithTrial(
  uow: IUnitOfWork,
  user: UserEntity,
  feature: PlanFeature,
): Promise<void> {
  const { user: effectiveUser, plan } = await resolveEffectiveAccess(uow, user);
  if (hasUnlimitedPlanAccess(effectiveUser, plan)) return;

  const resolved = await resolveQuotaUsage(uow, effectiveUser, plan);
  assertPlanFeature(
    effectiveUser,
    plan,
    feature,
    resolved.usage,
    resolved.bonus,
  );
}

export async function assertPathGenerationWithTrial(
  uow: IUnitOfWork,
  user: UserEntity,
  mode: PathMode,
): Promise<void> {
  const { user: effectiveUser, plan } = await resolveEffectiveAccess(uow, user);
  if (hasUnlimitedPlanAccess(effectiveUser, plan)) return;

  const resolved = await resolveQuotaUsage(uow, effectiveUser, plan);
  assertPathGeneration(
    effectiveUser,
    plan,
    mode,
    resolved.usage,
    resolved.bonus,
  );
}

export async function consumeTrialFeature(
  uow: IUnitOfWork,
  user: UserEntity,
  feature: PlanFeature,
): Promise<void> {
  const { user: effectiveUser, plan } = await resolveEffectiveAccess(uow, user);
  if (hasUnlimitedPlanAccess(effectiveUser, plan)) return;

  const resolved = await resolveQuotaUsage(uow, effectiveUser, plan);
  assertPlanFeature(
    effectiveUser,
    plan,
    feature,
    resolved.usage,
    resolved.bonus,
  );
  await incrementQuotaUsage(uow, effectiveUser, plan, feature);
}

export async function consumePathGeneration(
  uow: IUnitOfWork,
  user: UserEntity,
  mode: PathMode,
): Promise<void> {
  const { user: effectiveUser, plan } = await resolveEffectiveAccess(uow, user);
  if (hasUnlimitedPlanAccess(effectiveUser, plan)) return;

  const resolved = await resolveQuotaUsage(uow, effectiveUser, plan);
  assertPathGeneration(
    effectiveUser,
    plan,
    mode,
    resolved.usage,
    resolved.bonus,
  );
  await incrementQuotaUsage(
    uow,
    effectiveUser,
    plan,
    mode === 'standard' ? 'standard_path' : 'deep_path',
  );
}
