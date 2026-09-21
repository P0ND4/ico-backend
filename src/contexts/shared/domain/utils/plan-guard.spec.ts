import {
  assertPlanFeature,
  getEffectiveFeatureLimit,
  getEffectivePathLimit,
  hasUnlimitedPlanAccess,
  isVipActive,
  type QuotaBonus,
} from './plan-guard';
import type { UserEntity } from '../entities/auth/user.entity';
import type { SubscriptionPlanEntity } from '../entities/config/subscription-plan.entity';
import { ForbiddenPlanError } from '../errors/forbidden-plan.error';

const NOW = new Date('2026-01-10T00:00:00.000Z');
const PAST = new Date('2026-01-09T00:00:00.000Z');
const FUTURE = new Date('2026-01-11T00:00:00.000Z');

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    email: 'test@example.com',
    planCode: 'free',
    isVip: false,
    vipExpiresAt: null,
    freeTrialUsed: false,
    ...overrides,
  } as UserEntity;
}

function makePlan(
  overrides: Partial<SubscriptionPlanEntity> = {},
): SubscriptionPlanEntity {
  return {
    code: 'free',
    label: 'Gratuito',
    maxStandardPaths: 2,
    maxDeepPaths: 1,
    maxTutorRequests: 5,
    maxSummaryRequests: 2,
    isDefaultFree: true,
    isUnlimited: false,
    quotaResetDays: null,
    quotaScope: 'device',
    enforceDeviceTrialSlot: false,
    ...overrides,
  } as SubscriptionPlanEntity;
}

function makeBonus(overrides: Partial<QuotaBonus> = {}): QuotaBonus {
  return {
    tutorRemaining: 0,
    summaryRemaining: 0,
    standardPathRemaining: 0,
    deepPathRemaining: 0,
    ...overrides,
  };
}

describe('isVipActive', () => {
  it('is false for a non-VIP user', () => {
    expect(isVipActive(makeUser(), NOW)).toBe(false);
  });

  it('is true for a permanent VIP grant', () => {
    expect(
      isVipActive(makeUser({ isVip: true, vipExpiresAt: null }), NOW),
    ).toBe(true);
  });

  it('is true while the expiry is still in the future', () => {
    expect(
      isVipActive(makeUser({ isVip: true, vipExpiresAt: FUTURE }), NOW),
    ).toBe(true);
  });

  it('is false when vipExpiresAt equals now', () => {
    expect(isVipActive(makeUser({ isVip: true, vipExpiresAt: NOW }), NOW)).toBe(
      false,
    );
  });

  it('is false when the expiry already elapsed', () => {
    expect(
      isVipActive(makeUser({ isVip: true, vipExpiresAt: PAST }), NOW),
    ).toBe(false);
  });
});

describe('hasUnlimitedPlanAccess', () => {
  it('rejects an expired VIP on a limited plan', () => {
    const user = makeUser({ isVip: true, vipExpiresAt: PAST });
    expect(hasUnlimitedPlanAccess(user, makePlan(), NOW)).toBe(false);
  });

  it('still honours an unlimited plan for an expired VIP', () => {
    const user = makeUser({ isVip: true, vipExpiresAt: PAST });
    expect(
      hasUnlimitedPlanAccess(user, makePlan({ isUnlimited: true }), NOW),
    ).toBe(true);
  });
});

describe('effective limits with a quota bonus', () => {
  it('tops up a finite feature limit', () => {
    const plan = makePlan({ maxTutorRequests: 5 });
    expect(
      getEffectiveFeatureLimit(plan, 'tutor', makeBonus({ tutorRemaining: 3 })),
    ).toBe(8);
  });

  it('keeps NULL (unlimited) absorbing the bonus', () => {
    const plan = makePlan({ maxTutorRequests: null });
    expect(
      getEffectiveFeatureLimit(plan, 'tutor', makeBonus({ tutorRemaining: 3 })),
    ).toBeNull();
  });

  it('tops up a finite path limit', () => {
    const plan = makePlan({ maxDeepPaths: 1 });
    expect(
      getEffectivePathLimit(plan, 'deep', makeBonus({ deepPathRemaining: 2 })),
    ).toBe(3);
  });
});

describe('assertPlanFeature with a quota bonus', () => {
  it('lets a disabled feature through when a bonus covers it', () => {
    const plan = makePlan({ maxTutorRequests: 0 });
    expect(() =>
      assertPlanFeature(
        makeUser(),
        plan,
        'tutor',
        { tutorUses: 0, summaryUses: 0, standardPathUses: 0, deepPathUses: 0 },
        makeBonus({ tutorRemaining: 3 }),
      ),
    ).not.toThrow();
  });

  it('still throws for a disabled feature without a bonus', () => {
    const plan = makePlan({ maxTutorRequests: 0 });
    expect(() =>
      assertPlanFeature(makeUser(), plan, 'tutor', null, makeBonus()),
    ).toThrow(ForbiddenPlanError);
  });

  it('throws once plan quota and bonus are both exhausted', () => {
    const plan = makePlan({ maxTutorRequests: 5 });
    expect(() =>
      assertPlanFeature(
        makeUser(),
        plan,
        'tutor',
        { tutorUses: 5, summaryUses: 0, standardPathUses: 0, deepPathUses: 0 },
        makeBonus({ tutorRemaining: 0 }),
      ),
    ).toThrow(ForbiddenPlanError);
  });

  it('lets an exhausted plan quota through while bonus remains', () => {
    const plan = makePlan({ maxTutorRequests: 5 });
    expect(() =>
      assertPlanFeature(
        makeUser(),
        plan,
        'tutor',
        { tutorUses: 5, summaryUses: 0, standardPathUses: 0, deepPathUses: 0 },
        makeBonus({ tutorRemaining: 2 }),
      ),
    ).not.toThrow();
  });

  it('does not let a bonus lift the device trial slot block', () => {
    const plan = makePlan({
      enforceDeviceTrialSlot: true,
      quotaResetDays: null,
    });
    const user = makeUser({ freeTrialUsed: true });
    expect(() =>
      assertPlanFeature(
        user,
        plan,
        'tutor',
        null,
        makeBonus({ tutorRemaining: 9 }),
      ),
    ).toThrow(ForbiddenPlanError);
  });
});
