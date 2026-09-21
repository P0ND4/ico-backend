import type { UserEntity } from '../entities/auth/user.entity';
import type { SubscriptionPlanEntity } from '../entities/config/subscription-plan.entity';
import type { IUnitOfWork } from '../repositories/unit-of-work.interface';
import type { CouponResource } from '../entities/config/coupon.entity';
import {
  EMPTY_QUOTA_BONUS,
  getFeatureLimit,
  getPathLimit,
  hasUnlimitedPlanAccess,
  resolveUserDeviceId,
  type QuotaBonus,
  type TrialUsage,
} from './plan-guard';

export type QuotaFeature = 'tutor' | 'summary' | 'standard_path' | 'deep_path';

export interface ResolvedQuotaUsage {
  usage: TrialUsage;
  bonus: QuotaBonus;
  periodStartedAt: Date | null;
  quotaRenewsAt: Date | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function shouldResetPeriod(
  plan: SubscriptionPlanEntity | null | undefined,
  periodStartedAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!plan?.quotaResetDays || !periodStartedAt) return false;
  const elapsedMs = now.getTime() - periodStartedAt.getTime();
  return elapsedMs >= plan.quotaResetDays * MS_PER_DAY;
}

export function computeQuotaRenewsAt(
  plan: SubscriptionPlanEntity | null | undefined,
  periodStartedAt: Date | null | undefined,
): Date | null {
  if (!plan?.quotaResetDays || !periodStartedAt) return null;
  return new Date(periodStartedAt.getTime() + plan.quotaResetDays * MS_PER_DAY);
}

function recordToUsage(record: {
  tutorUses: number;
  summaryUses: number;
  standardPathUses: number;
  deepPathUses: number;
}): TrialUsage {
  return {
    tutorUses: record.tutorUses,
    summaryUses: record.summaryUses,
    standardPathUses: record.standardPathUses,
    deepPathUses: record.deepPathUses,
  };
}

const emptyUsage: TrialUsage = {
  tutorUses: 0,
  summaryUses: 0,
  standardPathUses: 0,
  deepPathUses: 0,
};

/** Remaining coupon bonus per bucket. Never resets with the quota period. */
export async function resolveQuotaBonus(
  uow: IUnitOfWork,
  userId: string,
): Promise<QuotaBonus> {
  const records = await uow.userQuotaBonuses.findAllByUserId(userId);
  if (records.length === 0) return EMPTY_QUOTA_BONUS;

  const bonus: QuotaBonus = { ...EMPTY_QUOTA_BONUS };
  for (const record of records) {
    const remaining = Math.max(0, record.grantedUses - record.consumedUses);
    switch (record.resource) {
      case 'tutor':
        bonus.tutorRemaining += remaining;
        break;
      case 'summary':
        bonus.summaryRemaining += remaining;
        break;
      case 'standard_path':
        bonus.standardPathRemaining += remaining;
        break;
      case 'deep_path':
        bonus.deepPathRemaining += remaining;
        break;
    }
  }
  return bonus;
}

function planLimitFor(
  plan: SubscriptionPlanEntity | null | undefined,
  feature: QuotaFeature,
): number | null {
  switch (feature) {
    case 'tutor':
      return getFeatureLimit(plan, 'tutor');
    case 'summary':
      return getFeatureLimit(plan, 'summary');
    case 'standard_path':
      return getPathLimit(plan, 'standard');
    case 'deep_path':
      return getPathLimit(plan, 'deep');
  }
}

function usedFor(usage: TrialUsage, feature: QuotaFeature): number {
  switch (feature) {
    case 'tutor':
      return usage.tutorUses;
    case 'summary':
      return usage.summaryUses;
    case 'standard_path':
      return usage.standardPathUses;
    case 'deep_path':
      return usage.deepPathUses;
  }
}

export async function resolveQuotaUsage(
  uow: IUnitOfWork,
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
): Promise<ResolvedQuotaUsage> {
  if (hasUnlimitedPlanAccess(user, plan)) {
    return {
      usage: emptyUsage,
      bonus: EMPTY_QUOTA_BONUS,
      periodStartedAt: null,
      quotaRenewsAt: null,
    };
  }

  const bonus = await resolveQuotaBonus(uow, user.id);
  const scope = plan?.quotaScope ?? 'device';

  if (scope === 'user') {
    let record = await uow.userPlanQuotas.findByUserId(user.id);
    if (!record) {
      record = await uow.userPlanQuotas.ensureUserRecord(user.id);
    }

    if (shouldResetPeriod(plan, record.periodStartedAt)) {
      record = await uow.userPlanQuotas.resetPeriod(user.id);
    }

    return {
      usage: recordToUsage(record),
      bonus,
      periodStartedAt: record.periodStartedAt,
      quotaRenewsAt: computeQuotaRenewsAt(plan, record.periodStartedAt),
    };
  }

  const deviceId = resolveUserDeviceId(user);
  if (!deviceId) {
    return {
      usage: emptyUsage,
      bonus,
      periodStartedAt: null,
      quotaRenewsAt: null,
    };
  }

  let record = await uow.deviceTrials.findByDeviceId(deviceId);
  if (!record) {
    record = await uow.deviceTrials.ensureDeviceRecord(deviceId, user.id);
  }

  if (shouldResetPeriod(plan, record.periodStartedAt)) {
    record = await uow.deviceTrials.resetPeriod(deviceId, user.id);
  }

  return {
    usage: recordToUsage(record),
    bonus,
    periodStartedAt: record.periodStartedAt,
    quotaRenewsAt: computeQuotaRenewsAt(plan, record.periodStartedAt),
  };
}

/**
 * Consumption order: the plan quota is spent first, and only once it is
 * exhausted the permanent coupon bonus is burned.
 */
export async function incrementQuotaUsage(
  uow: IUnitOfWork,
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
  feature: QuotaFeature,
): Promise<void> {
  if (hasUnlimitedPlanAccess(user, plan)) return;

  const resolved = await resolveQuotaUsage(uow, user, plan);
  const planLimit = planLimitFor(plan, feature);
  const used = usedFor(resolved.usage, feature);

  if (planLimit != null && used >= planLimit) {
    const consumed = await uow.userQuotaBonuses.consume(
      user.id,
      feature as CouponResource,
      1,
    );
    if (consumed) return;
  }

  await incrementPeriodCounter(uow, user, plan, feature);
}

async function incrementPeriodCounter(
  uow: IUnitOfWork,
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
  feature: QuotaFeature,
): Promise<void> {
  const scope = plan?.quotaScope ?? 'device';

  if (scope === 'user') {
    switch (feature) {
      case 'tutor':
        await uow.userPlanQuotas.incrementTutorUse(user.id);
        break;
      case 'summary':
        await uow.userPlanQuotas.incrementSummaryUse(user.id);
        break;
      case 'standard_path':
        await uow.userPlanQuotas.incrementStandardPathUse(user.id);
        break;
      case 'deep_path':
        await uow.userPlanQuotas.incrementDeepPathUse(user.id);
        break;
    }
    return;
  }

  const deviceId = resolveUserDeviceId(user);
  if (!deviceId) return;

  switch (feature) {
    case 'tutor':
      await uow.deviceTrials.incrementTutorUse(deviceId, user.id);
      break;
    case 'summary':
      await uow.deviceTrials.incrementSummaryUse(deviceId, user.id);
      break;
    case 'standard_path':
      await uow.deviceTrials.incrementStandardPathUse(deviceId, user.id);
      break;
    case 'deep_path':
      await uow.deviceTrials.incrementDeepPathUse(deviceId, user.id);
      break;
  }
}
