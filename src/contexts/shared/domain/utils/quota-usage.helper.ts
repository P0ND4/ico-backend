import type { UserEntity } from '../entities/auth/user.entity';
import type { SubscriptionPlanEntity } from '../entities/config/subscription-plan.entity';
import type { IUnitOfWork } from '../repositories/unit-of-work.interface';
import { hasUnlimitedPlanAccess, resolveUserDeviceId, type TrialUsage } from './plan-guard';

export interface ResolvedQuotaUsage {
  usage: TrialUsage;
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

export async function resolveQuotaUsage(
  uow: IUnitOfWork,
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
): Promise<ResolvedQuotaUsage> {
  if (hasUnlimitedPlanAccess(user, plan)) {
    return { usage: emptyUsage, periodStartedAt: null, quotaRenewsAt: null };
  }

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
      periodStartedAt: record.periodStartedAt,
      quotaRenewsAt: computeQuotaRenewsAt(plan, record.periodStartedAt),
    };
  }

  const deviceId = resolveUserDeviceId(user);
  if (!deviceId) {
    return { usage: emptyUsage, periodStartedAt: null, quotaRenewsAt: null };
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
    periodStartedAt: record.periodStartedAt,
    quotaRenewsAt: computeQuotaRenewsAt(plan, record.periodStartedAt),
  };
}

export async function incrementQuotaUsage(
  uow: IUnitOfWork,
  user: UserEntity,
  plan: SubscriptionPlanEntity | null | undefined,
  feature: 'tutor' | 'summary' | 'standard_path' | 'deep_path',
): Promise<void> {
  if (hasUnlimitedPlanAccess(user, plan)) return;

  const scope = plan?.quotaScope ?? 'device';

  if (scope === 'user') {
    const resolved = await resolveQuotaUsage(uow, user, plan);
    void resolved;

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

  await resolveQuotaUsage(uow, user, plan);

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
