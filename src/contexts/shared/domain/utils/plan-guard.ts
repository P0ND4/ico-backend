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

/** Extra uses left over from redeemed coupons, per quota bucket. */
export interface QuotaBonus {
  tutorRemaining: number;
  summaryRemaining: number;
  standardPathRemaining: number;
  deepPathRemaining: number;
}

export const EMPTY_QUOTA_BONUS: QuotaBonus = {
  tutorRemaining: 0,
  summaryRemaining: 0,
  standardPathRemaining: 0,
  deepPathRemaining: 0,
};

export function isDefaultFreePlan(
  plan: SubscriptionPlanEntity | null | undefined,
): boolean {
  return plan?.isDefaultFree === true;
}

/**
 * VIP with an expiry date. A VIP grant whose `vipExpiresAt` already elapsed is
 * rejected even if the row has not been normalized yet by the lazy write.
 */
export function isVipActive(user: UserEntity, now: Date = new Date()): boolean {
  if (!user.isVip) return false;
  return user.vipExpiresAt == null || user.vipExpiresAt > now;
}

export function hasUnlimitedPlanAccess(
  user: UserEntity,
  plan?: SubscriptionPlanEntity | null,
  now: Date = new Date(),
): boolean {
  return isVipActive(user, now) || plan?.isUnlimited === true;
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

/** NULL (unlimited) absorbs the bonus; a finite limit is topped up by it. */
export function getEffectiveFeatureLimit(
  plan: SubscriptionPlanEntity | null | undefined,
  feature: PlanFeature,
  bonus?: QuotaBonus | null,
): number | null {
  const limit = getFeatureLimit(plan, feature);
  if (limit == null) return null;
  const extra =
    feature === 'tutor'
      ? (bonus?.tutorRemaining ?? 0)
      : (bonus?.summaryRemaining ?? 0);
  return limit + Math.max(0, extra);
}

/** NULL (unlimited) absorbs the bonus; a finite limit is topped up by it. */
export function getEffectivePathLimit(
  plan: SubscriptionPlanEntity | null | undefined,
  mode: PathMode,
  bonus?: QuotaBonus | null,
): number | null {
  const limit = getPathLimit(plan, mode);
  if (limit == null) return null;
  const extra =
    mode === 'standard'
      ? (bonus?.standardPathRemaining ?? 0)
      : (bonus?.deepPathRemaining ?? 0);
  return limit + Math.max(0, extra);
}

export function getRemainingFromPlan(
  plan: SubscriptionPlanEntity | null | undefined,
  usage: TrialUsage,
  bonus?: QuotaBonus | null,
): {
  tutorRemaining: number | null;
  summaryRemaining: number | null;
  standardPathRemaining: number | null;
  deepPathRemaining: number | null;
} {
  const tutorLimit = getEffectiveFeatureLimit(plan, 'tutor', bonus);
  const summaryLimit = getEffectiveFeatureLimit(plan, 'summary', bonus);
  const standardLimit = getEffectivePathLimit(plan, 'standard', bonus);
  const deepLimit = getEffectivePathLimit(plan, 'deep', bonus);

  return {
    tutorRemaining:
      tutorLimit == null ? null : Math.max(0, tutorLimit - usage.tutorUses),
    summaryRemaining:
      summaryLimit == null
        ? null
        : Math.max(0, summaryLimit - usage.summaryUses),
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
  bonus?: QuotaBonus | null,
): void {
  if (hasUnlimitedPlanAccess(user, plan)) return;

  if (isTrialSlotBlocked(user, plan)) {
    throw new ForbiddenPlanError('trial_exhausted');
  }

  const limit = getEffectiveFeatureLimit(plan, feature, bonus);
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
  bonus?: QuotaBonus | null,
): void {
  if (hasUnlimitedPlanAccess(user, plan)) return;

  if (isTrialSlotBlocked(user, plan)) {
    throw new ForbiddenPlanError('trial_exhausted');
  }

  const limit = getEffectivePathLimit(plan, mode, bonus);
  const usage = trialUsage ?? {
    tutorUses: 0,
    summaryUses: 0,
    standardPathUses: 0,
    deepPathUses: 0,
  };

  if (limit == null) return;

  if (limit === 0) {
    throw new ForbiddenPlanError(
      mode === 'standard' ? 'standard_path' : 'deep_path',
    );
  }

  const used =
    mode === 'standard' ? usage.standardPathUses : usage.deepPathUses;
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
