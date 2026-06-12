import type { UserEntity } from '../entities/auth/user.entity';
import type { SubscriptionPlanEntity } from '../entities/config/subscription-plan.entity';
import { ForbiddenPlanError } from '../errors/forbidden-plan.error';

/** @deprecated Use isDefaultFreePlan(plan) — kept for legacy references */
export const FREE_PLAN_CODE = 'free';
/** @deprecated Use plan.isUnlimited — kept for legacy references */
export const PREMIUM_PLAN_CODE = 'premium';

export type PlanFeature = 'tutor' | 'summary';
export type PathMode = 'standard' | 'deep';

export interface TrialUsage {
  tutorUses: number;
  summaryUses: number;
  standardPathUses: number;
  deepPathUses: number;
}

export function resolveUserDeviceId(user: UserEntity): string | null {
  return user.deviceId ?? user.guestDeviceId ?? null;
}

export function isDefaultFreePlan(
  plan: SubscriptionPlanEntity | null | undefined,
): boolean {
  return plan?.isDefaultFree === true;
}

export function hasUnlimitedPlanAccess(
  user: UserEntity,
  plan?: SubscriptionPlanEntity | null,
): boolean {
  return user.isVip || plan?.isUnlimited === true;
}

export function getFeatureLimit(
  plan: SubscriptionPlanEntity | null | undefined,
  feature: PlanFeature,
): number | null {
  if (!plan) return 0;
  return feature === 'tutor' ? plan.maxTutorRequests : plan.maxSummaryRequests;
}

export function getPathLimit(
  plan: SubscriptionPlanEntity | null | undefined,
  mode: PathMode,
): number | null {
  if (!plan) return 0;
  return mode === 'standard' ? plan.maxStandardPaths : plan.maxDeepPaths;
}

export function getRemainingFromPlan(
  plan: SubscriptionPlanEntity | null | undefined,
  usage: TrialUsage,
): {
  tutorRemaining: number | null;
  summaryRemaining: number | null;
  standardPathRemaining: number | null;
  deepPathRemaining: number | null;
} {
  const tutorLimit = getFeatureLimit(plan, 'tutor');
  const summaryLimit = getFeatureLimit(plan, 'summary');
  const standardLimit = getPathLimit(plan, 'standard');
  const deepLimit = getPathLimit(plan, 'deep');

  return {
    tutorRemaining:
      tutorLimit == null ? null : Math.max(0, tutorLimit - usage.tutorUses),
    summaryRemaining:
      summaryLimit == null ? null : Math.max(0, summaryLimit - usage.summaryUses),
    standardPathRemaining:
      standardLimit == null
        ? null
        : Math.max(0, standardLimit - usage.standardPathUses),
    deepPathRemaining:
      deepLimit == null ? null : Math.max(0, deepLimit - usage.deepPathUses),
  };
}

export function isTrialSlotBlocked(
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
): boolean {
  return (
    isDefaultFreePlan(plan) &&
    plan?.enforceDeviceTrialSlot === true &&
    plan.quotaResetDays == null &&
    user.freeTrialUsed
  );
}

/** Blocks default-free users on a device that already consumed the trial slot. VIP and unlimited bypass. */
export function assertTrialAccess(
  user: UserEntity,
  plan?: SubscriptionPlanEntity | null,
): void {
  if (hasUnlimitedPlanAccess(user, plan)) return;
  if (isTrialSlotBlocked(user, plan)) {
    throw new ForbiddenPlanError('trial_exhausted');
  }
}

export function assertPlanFeature(
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
  feature: PlanFeature,
  trialUsage?: TrialUsage | null,
): void {
  if (hasUnlimitedPlanAccess(user, plan)) return;

  if (isTrialSlotBlocked(user, plan)) {
    throw new ForbiddenPlanError('trial_exhausted');
  }

  const limit = getFeatureLimit(plan, feature);
  const usage = trialUsage ?? {
    tutorUses: 0,
    summaryUses: 0,
    standardPathUses: 0,
    deepPathUses: 0,
  };

  if (limit == null) return;

  if (limit === 0) {
    throw new ForbiddenPlanError(feature);
  }

  const used = feature === 'tutor' ? usage.tutorUses : usage.summaryUses;
  if (used >= limit) {
    throw new ForbiddenPlanError(
      feature === 'tutor' ? 'trial_tutor_exhausted' : 'trial_summary_exhausted',
    );
  }
}

export function assertPathGeneration(
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
  mode: PathMode,
  trialUsage?: TrialUsage | null,
): void {
  if (hasUnlimitedPlanAccess(user, plan)) return;

  if (isTrialSlotBlocked(user, plan)) {
    throw new ForbiddenPlanError('trial_exhausted');
  }

  const limit = getPathLimit(plan, mode);
  const usage = trialUsage ?? {
    tutorUses: 0,
    summaryUses: 0,
    standardPathUses: 0,
    deepPathUses: 0,
  };

  if (limit == null) return;

  if (limit === 0) {
    throw new ForbiddenPlanError(mode === 'standard' ? 'standard_path' : 'deep_path');
  }

  const used = mode === 'standard' ? usage.standardPathUses : usage.deepPathUses;
  if (used >= limit) {
    throw new ForbiddenPlanError(
      mode === 'standard'
        ? 'trial_standard_path_exhausted'
        : 'trial_deep_path_exhausted',
    );
  }
}

/** AI-backed actions that require an active trial or paid/VIP access. */
export function assertAiAccess(
  user: UserEntity,
  plan?: SubscriptionPlanEntity | null,
): void {
  assertTrialAccess(user, plan);
}
