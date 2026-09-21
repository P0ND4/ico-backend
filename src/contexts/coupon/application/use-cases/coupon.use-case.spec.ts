import { CouponUseCase } from './coupon.use-case';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import type { CouponEntity } from 'src/contexts/shared/domain/entities/config/coupon.entity';
import {
  CouponAlreadyRedeemedError,
  CouponExhaustedError,
  CouponExpiredError,
  CouponInvalidConfigError,
  CouponNotFoundError,
  CouponRequiresLinkedAccountError,
  CouponUserNotFoundError,
} from '../../domain/errors';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    name: 'Test',
    email: 'test@example.com',
    planCode: 'free',
    isVip: false,
    vipExpiresAt: null,
    planExpiresAt: null,
    basePlanCode: null,
    freeTrialUsed: false,
    ...overrides,
  } as UserEntity;
}

function makeCoupon(overrides: Partial<CouponEntity> = {}): CouponEntity {
  return {
    id: 'coupon-1',
    code: 'BIENVENIDA20',
    grantType: 'quota_bonus',
    resource: 'tutor',
    amount: 20,
    planCode: null,
    durationDays: null,
    maxRedemptions: 100,
    redeemedCount: 0,
    expiresAt: null,
    isActive: true,
    ...overrides,
  } as CouponEntity;
}

interface Harness {
  uow: IUnitOfWork;
  users: { findById: jest.Mock; update: jest.Mock };
  coupons: { findByCode: jest.Mock; claimRedemptionSlot: jest.Mock };
  couponRedemptions: {
    findByCouponAndUser: jest.Mock;
    findAllByUserId: jest.Mock;
    create: jest.Mock;
  };
  userQuotaBonuses: { grant: jest.Mock };
  subscriptionPlans: { findByCode: jest.Mock };
}

function makeHarness(
  options: {
    user?: UserEntity | null;
    coupon?: CouponEntity | null;
    claimed?: CouponEntity | null;
    existingRedemption?: unknown;
    plan?: unknown;
  } = {},
): Harness {
  const user = options.user === undefined ? makeUser() : options.user;
  const coupon = options.coupon === undefined ? makeCoupon() : options.coupon;
  const claimed =
    options.claimed === undefined ? (coupon ?? null) : options.claimed;

  const users = {
    findById: jest.fn().mockResolvedValue(user),
    update: jest
      .fn()
      .mockImplementation((id: string, patch: Partial<UserEntity>) =>
        Promise.resolve({ ...(user as UserEntity), ...patch }),
      ),
  };
  const coupons = {
    findByCode: jest.fn().mockResolvedValue(coupon),
    claimRedemptionSlot: jest.fn().mockResolvedValue(claimed),
  };
  const couponRedemptions = {
    findByCouponAndUser: jest
      .fn()
      .mockResolvedValue(options.existingRedemption ?? null),
    findAllByUserId: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockImplementation((data: Record<string, unknown>) =>
        Promise.resolve({ id: 'redemption-1', ...data }),
      ),
  };
  const userQuotaBonuses = { grant: jest.fn().mockResolvedValue(undefined) };
  const subscriptionPlans = {
    findByCode: jest
      .fn()
      .mockResolvedValue(
        options.plan === undefined
          ? { code: 'pro', label: 'Pro' }
          : options.plan,
      ),
  };

  const uow = {
    users,
    coupons,
    couponRedemptions,
    userQuotaBonuses,
    subscriptionPlans,
    // The transactional UoW is the same object, matching the real
    // buildTransactional contract from the caller's point of view.
    withTransaction: <R>(fn: (tx: IUnitOfWork) => Promise<R>) => fn(uow),
  } as unknown as IUnitOfWork;

  return {
    uow,
    users,
    coupons,
    couponRedemptions,
    userQuotaBonuses,
    subscriptionPlans,
  };
}

describe('CouponUseCase.redeem', () => {
  it('grants a quota bonus and records the redemption', async () => {
    const h = makeHarness();
    const result = await new CouponUseCase(h.uow).redeem({
      userId: 'user-1',
      code: 'BIENVENIDA20',
    });

    expect(h.userQuotaBonuses.grant).toHaveBeenCalledWith(
      'user-1',
      'tutor',
      20,
    );
    expect(h.users.update).not.toHaveBeenCalled();
    expect(result.redemption.effectSummary).toBe('+20 tutor uses');
    expect(result.redemption.grantedUntil).toBeNull();
  });

  it('grants time-boxed VIP access', async () => {
    const h = makeHarness({
      coupon: makeCoupon({
        code: 'VIP30',
        grantType: 'vip_access',
        resource: null,
        amount: null,
        durationDays: 30,
      }),
    });

    const result = await new CouponUseCase(h.uow).redeem({
      userId: 'user-1',
      code: 'VIP30',
    });

    const patch = h.users.update.mock.calls[0][1] as {
      isVip: boolean;
      vipExpiresAt: Date;
    };
    expect(patch.isVip).toBe(true);
    expect(patch.vipExpiresAt).toBeInstanceOf(Date);
    expect(result.isVip).toBe(true);
    expect(result.redemption.grantedUntil).toEqual(patch.vipExpiresAt);
  });

  it('extends a running VIP grant instead of restarting it', async () => {
    const runningUntil = new Date(Date.now() + 10 * MS_PER_DAY);
    const h = makeHarness({
      user: makeUser({ isVip: true, vipExpiresAt: runningUntil }),
      coupon: makeCoupon({
        code: 'VIP30',
        grantType: 'vip_access',
        resource: null,
        amount: null,
        durationDays: 30,
      }),
    });

    await new CouponUseCase(h.uow).redeem({ userId: 'user-1', code: 'VIP30' });

    const patch = h.users.update.mock.calls[0][1] as { vipExpiresAt: Date };
    expect(patch.vipExpiresAt.getTime()).toBe(
      runningUntil.getTime() + 30 * MS_PER_DAY,
    );
  });

  it('never downgrades a permanent VIP grant to a dated one', async () => {
    const h = makeHarness({
      user: makeUser({ isVip: true, vipExpiresAt: null }),
      coupon: makeCoupon({
        code: 'VIP30',
        grantType: 'vip_access',
        resource: null,
        amount: null,
        durationDays: 30,
      }),
    });

    await new CouponUseCase(h.uow).redeem({ userId: 'user-1', code: 'VIP30' });

    expect(h.users.update.mock.calls[0][1]).toEqual({
      isVip: true,
      vipExpiresAt: null,
    });
  });

  it('upgrades the plan and records the base plan', async () => {
    const h = makeHarness({
      coupon: makeCoupon({
        code: 'PRO90',
        grantType: 'plan_upgrade',
        resource: null,
        amount: null,
        planCode: 'pro',
        durationDays: 90,
      }),
    });

    const result = await new CouponUseCase(h.uow).redeem({
      userId: 'user-1',
      code: 'PRO90',
    });

    const patch = h.users.update.mock.calls[0][1] as {
      planCode: string;
      basePlanCode: string;
      planExpiresAt: Date;
    };
    expect(patch.planCode).toBe('pro');
    expect(patch.basePlanCode).toBe('free');
    expect(result.planCode).toBe('pro');
    expect(result.redemption.effectSummary).toContain('Pro');
  });

  it('fixes basePlanCode only the first time', async () => {
    const h = makeHarness({
      user: makeUser({ planCode: 'pro', basePlanCode: 'free' }),
      coupon: makeCoupon({
        code: 'PROPLUS30',
        grantType: 'plan_upgrade',
        resource: null,
        amount: null,
        planCode: 'pro-plus',
        durationDays: 30,
      }),
      plan: { code: 'pro-plus', label: 'Pro Plus' },
    });

    await new CouponUseCase(h.uow).redeem({
      userId: 'user-1',
      code: 'PROPLUS30',
    });

    const patch = h.users.update.mock.calls[0][1] as { basePlanCode: string };
    expect(patch.basePlanCode).toBe('free');
  });

  it('normalizes the code to uppercase before looking it up', async () => {
    const h = makeHarness();
    await new CouponUseCase(h.uow).redeem({
      userId: 'user-1',
      code: '  bienvenida20 ',
    });
    expect(h.coupons.findByCode).toHaveBeenCalledWith('BIENVENIDA20');
  });

  it('rejects a guest account', async () => {
    const h = makeHarness({ user: makeUser({ email: null }) });
    await expect(
      new CouponUseCase(h.uow).redeem({ userId: 'user-1', code: 'X' }),
    ).rejects.toBeInstanceOf(CouponRequiresLinkedAccountError);
    expect(h.coupons.findByCode).not.toHaveBeenCalled();
  });

  it('rejects a missing user', async () => {
    const h = makeHarness({ user: null });
    await expect(
      new CouponUseCase(h.uow).redeem({ userId: 'ghost', code: 'X' }),
    ).rejects.toBeInstanceOf(CouponUserNotFoundError);
  });

  it('rejects an unknown code', async () => {
    const h = makeHarness({ coupon: null });
    await expect(
      new CouponUseCase(h.uow).redeem({ userId: 'user-1', code: 'NOPE' }),
    ).rejects.toBeInstanceOf(CouponNotFoundError);
  });

  it('treats a deactivated coupon as not found', async () => {
    const h = makeHarness({ coupon: makeCoupon({ isActive: false }) });
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponNotFoundError);
  });

  it('rejects an expired coupon', async () => {
    const h = makeHarness({
      coupon: makeCoupon({ expiresAt: new Date(Date.now() - MS_PER_DAY) }),
    });
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponExpiredError);
  });

  it('rejects an exhausted coupon on the pre-check', async () => {
    const h = makeHarness({
      coupon: makeCoupon({ maxRedemptions: 1, redeemedCount: 1 }),
    });
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponExhaustedError);
    expect(h.coupons.claimRedemptionSlot).not.toHaveBeenCalled();
  });

  it('rejects a coupon already redeemed by this user', async () => {
    const h = makeHarness({ existingRedemption: { id: 'redemption-0' } });
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponAlreadyRedeemedError);
  });

  it('rejects a misconfigured coupon', async () => {
    const h = makeHarness({
      coupon: makeCoupon({
        grantType: 'quota_bonus',
        resource: null,
        amount: null,
      }),
    });
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponInvalidConfigError);
  });

  it('rejects a plan_upgrade pointing at an unknown plan', async () => {
    const h = makeHarness({
      coupon: makeCoupon({
        grantType: 'plan_upgrade',
        resource: null,
        amount: null,
        planCode: 'ghost',
      }),
      plan: null,
    });
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponInvalidConfigError);
  });

  // --- race conditions: these are what the design actually protects ---

  it('reports exhaustion when the conditional slot claim returns null', async () => {
    const h = makeHarness({ claimed: null });
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponExhaustedError);
    expect(h.couponRedemptions.create).not.toHaveBeenCalled();
    expect(h.userQuotaBonuses.grant).not.toHaveBeenCalled();
  });

  it('maps a 23505 unique violation to already-redeemed', async () => {
    const h = makeHarness();
    h.couponRedemptions.create.mockRejectedValue(
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponAlreadyRedeemedError);
    expect(h.userQuotaBonuses.grant).not.toHaveBeenCalled();
  });

  it('maps a 23505 wrapped in driverError to already-redeemed', async () => {
    const h = makeHarness();
    h.couponRedemptions.create.mockRejectedValue(
      Object.assign(new Error('duplicate key'), {
        driverError: { code: '23505' },
      }),
    );
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toBeInstanceOf(CouponAlreadyRedeemedError);
  });

  it('rethrows unrelated persistence errors untouched', async () => {
    const h = makeHarness();
    h.couponRedemptions.create.mockRejectedValue(new Error('connection lost'));
    await expect(
      new CouponUseCase(h.uow).redeem({
        userId: 'user-1',
        code: 'BIENVENIDA20',
      }),
    ).rejects.toThrow('connection lost');
  });
});

describe('CouponUseCase.listMine', () => {
  it('maps the redemption history for the user', async () => {
    const h = makeHarness();
    const redeemedAt = new Date();
    h.couponRedemptions.findAllByUserId.mockResolvedValue([
      {
        id: 'redemption-1',
        code: 'VIP30',
        grantType: 'vip_access',
        effectSummary: 'VIP access for 30 days',
        grantedUntil: redeemedAt,
        redeemedAt,
      },
    ]);

    const result = await new CouponUseCase(h.uow).listMine('user-1');

    expect(h.couponRedemptions.findAllByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([
      {
        id: 'redemption-1',
        code: 'VIP30',
        grantType: 'vip_access',
        effectSummary: 'VIP access for 30 days',
        grantedUntil: redeemedAt,
        redeemedAt,
      },
    ]);
  });
});
