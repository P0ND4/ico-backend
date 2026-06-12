import type { UserEntity } from '../entities/auth/user.entity';
import type { SubscriptionPlanEntity } from '../entities/config/subscription-plan.entity';
import type { IUnitOfWork } from '../repositories/unit-of-work.interface';
import {
  assertPathGeneration,
  assertPlanFeature,
  getFeatureLimit,
  getPathLimit,
  getRemainingFromPlan,
  hasUnlimitedPlanAccess,
  isTrialSlotBlocked,
  type PathMode,
  type PlanFeature,
  type TrialUsage,
} from './plan-guard';
import { incrementQuotaUsage, resolveQuotaUsage } from './quota-usage.helper';

export type { TrialUsage, PlanFeature, PathMode };

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
}

export async function loadTrialUsage(
  uow: IUnitOfWork,
  user: UserEntity,
  plan?: SubscriptionPlanEntity | null,
): Promise<TrialUsage> {
  const resolvedPlan =
    plan ?? (await uow.subscriptionPlans.findByCode(user.planCode ?? 'free'));
  const resolved = await resolveQuotaUsage(uow, user, resolvedPlan);
  return resolved.usage;
}

export function computeTrialExhausted(
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
  quota: Omit<TrialQuotaProfile, 'quotaRenewsAt' | 'trialExhausted'>,
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
): TrialQuotaProfile {
  if (isTrialSlotBlocked(user, plan)) {
    const blocked: Omit<TrialQuotaProfile, 'quotaRenewsAt' | 'trialExhausted'> = {
      trialTutorRemaining: 0,
      trialSummaryRemaining: 0,
      trialStandardPathRemaining: 0,
      trialDeepPathRemaining: 0,
      tutorRequestLimit: getFeatureLimit(plan, 'tutor'),
      summaryRequestLimit: getFeatureLimit(plan, 'summary'),
      standardPathLimit: getPathLimit(plan, 'standard'),
      deepPathLimit: getPathLimit(plan, 'deep'),
    };
    return {
      ...blocked,
      quotaRenewsAt,
      trialExhausted: true,
    };
  }

  const remaining = getRemainingFromPlan(plan, usage);
  const quotaBody = {
    trialTutorRemaining: remaining.tutorRemaining,
    trialSummaryRemaining: remaining.summaryRemaining,
    trialStandardPathRemaining: remaining.standardPathRemaining,
    trialDeepPathRemaining: remaining.deepPathRemaining,
    tutorRequestLimit: getFeatureLimit(plan, 'tutor'),
    summaryRequestLimit: getFeatureLimit(plan, 'summary'),
    standardPathLimit: getPathLimit(plan, 'standard'),
    deepPathLimit: getPathLimit(plan, 'deep'),
  };

  return {
    ...quotaBody,
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
  );
}

export async function assertFeatureWithTrial(
  uow: IUnitOfWork,
  user: UserEntity,
  feature: PlanFeature,
): Promise<void> {
  const plan = await uow.subscriptionPlans.findByCode(user.planCode ?? 'free');
  if (hasUnlimitedPlanAccess(user, plan)) return;

  const resolved = await resolveQuotaUsage(uow, user, plan);
  assertPlanFeature(user, plan, feature, resolved.usage);
}

export async function assertPathGenerationWithTrial(
  uow: IUnitOfWork,
  user: UserEntity,
  mode: PathMode,
): Promise<void> {
  const plan = await uow.subscriptionPlans.findByCode(user.planCode ?? 'free');
  if (hasUnlimitedPlanAccess(user, plan)) return;

  const resolved = await resolveQuotaUsage(uow, user, plan);
  assertPathGeneration(user, plan, mode, resolved.usage);
}

export async function consumeTrialFeature(
  uow: IUnitOfWork,
  user: UserEntity,
  feature: PlanFeature,
): Promise<void> {
  const plan = await uow.subscriptionPlans.findByCode(user.planCode ?? 'free');
  if (hasUnlimitedPlanAccess(user, plan)) return;

  const resolved = await resolveQuotaUsage(uow, user, plan);
  assertPlanFeature(user, plan, feature, resolved.usage);
  await incrementQuotaUsage(uow, user, plan, feature);
}

export async function consumePathGeneration(
  uow: IUnitOfWork,
  user: UserEntity,
  mode: PathMode,
): Promise<void> {
  const plan = await uow.subscriptionPlans.findByCode(user.planCode ?? 'free');
  if (hasUnlimitedPlanAccess(user, plan)) return;

  const resolved = await resolveQuotaUsage(uow, user, plan);
  assertPathGeneration(user, plan, mode, resolved.usage);
  await incrementQuotaUsage(
    uow,
    user,
    plan,
    mode === 'standard' ? 'standard_path' : 'deep_path',
  );
}
