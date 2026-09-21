import { Inject, Injectable } from '@nestjs/common';
import { UNIT_OF_WORK } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { CouponEntity } from 'src/contexts/shared/domain/entities/config/coupon.entity';
import type { CouponRedemptionEntity } from 'src/contexts/shared/domain/entities/auth/coupon-redemption.entity';
import type { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';
import { DEFAULT_PLAN_CODE } from 'src/contexts/shared/domain/utils/access-expiry.helper';
import type {
  ICouponUseCase,
  RedeemCouponParams,
} from '../../domain/contracts/i-coupon.use-case';
import type {
  CouponRedemptionType,
  RedeemCouponResultType,
} from '../../domain/types/coupon.types';
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
const UNIQUE_VIOLATION = '23505';

/** Patch applied to the user row once the grant is resolved. */
interface UserAccessPatch {
  isVip?: boolean;
  vipExpiresAt?: Date | null;
  planCode?: string;
  planExpiresAt?: Date | null;
  basePlanCode?: string | null;
}

interface CouponEffect {
  effectSummary: string;
  grantedUntil: Date | null;
  userPatch: UserAccessPatch | null;
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

function isUniqueViolation(error: unknown): boolean {
  const candidate = error as { code?: string; driverError?: { code?: string } };
  return (
    candidate?.code === UNIQUE_VIOLATION ||
    candidate?.driverError?.code === UNIQUE_VIOLATION
  );
}

@Injectable()
export class CouponUseCase implements ICouponUseCase {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: IUnitOfWork,
  ) {}

  async redeem(params: RedeemCouponParams): Promise<RedeemCouponResultType> {
    const now = new Date();
    const code = normalizeCouponCode(params.code);

    const user = await this.uow.users.findById(params.userId);
    if (!user) throw new CouponUserNotFoundError();
    // Guests cannot redeem: the per-user guard would be trivially bypassable.
    if (user.email === null) throw new CouponRequiresLinkedAccountError();

    const coupon = await this.uow.coupons.findByCode(code);
    if (!coupon || !coupon.isActive) throw new CouponNotFoundError();
    if (coupon.expiresAt != null && coupon.expiresAt <= now) {
      throw new CouponExpiredError();
    }
    if (
      coupon.maxRedemptions != null &&
      coupon.redeemedCount >= coupon.maxRedemptions
    ) {
      throw new CouponExhaustedError();
    }

    // Optimistic pre-check only: the UNIQUE index below is the real guarantee.
    const existing = await this.uow.couponRedemptions.findByCouponAndUser(
      coupon.id,
      params.userId,
    );
    if (existing) throw new CouponAlreadyRedeemedError();

    return this.uow.withTransaction(async (tx) => {
      // Single conditional statement: re-checks active, expiry and the limit
      // under a row lock, so concurrent redemptions cannot overshoot.
      const claimed = await tx.coupons.claimRedemptionSlot(coupon.id, now);
      if (!claimed) throw new CouponExhaustedError();

      const freshUser = (await tx.users.findById(params.userId)) ?? user;
      const effect = await this.resolveEffect(tx, claimed, freshUser, now);

      let redemption: CouponRedemptionEntity;
      try {
        redemption = await tx.couponRedemptions.create({
          couponId: claimed.id,
          userId: params.userId,
          code: claimed.code,
          grantType: claimed.grantType,
          effectSummary: effect.effectSummary,
          grantedUntil: effect.grantedUntil,
          redeemedAt: now,
        });
      } catch (error) {
        if (isUniqueViolation(error)) throw new CouponAlreadyRedeemedError();
        throw error;
      }

      const updatedUser = await this.applyEffect(
        tx,
        claimed,
        freshUser,
        effect,
      );

      return {
        redemption: this.toRedemptionType(redemption),
        planCode: updatedUser.planCode,
        isVip: updatedUser.isVip,
        vipExpiresAt: updatedUser.vipExpiresAt,
        planExpiresAt: updatedUser.planExpiresAt,
      };
    });
  }

  async listMine(userId: string): Promise<CouponRedemptionType[]> {
    const redemptions =
      await this.uow.couponRedemptions.findAllByUserId(userId);
    return redemptions.map((redemption) => this.toRedemptionType(redemption));
  }

  /** Pure-ish resolution of what the coupon grants; performs no writes. */
  private async resolveEffect(
    tx: IUnitOfWork,
    coupon: CouponEntity,
    user: UserEntity,
    now: Date,
  ): Promise<CouponEffect> {
    switch (coupon.grantType) {
      case 'quota_bonus': {
        if (
          coupon.resource == null ||
          coupon.amount == null ||
          coupon.amount <= 0
        ) {
          throw new CouponInvalidConfigError(coupon.code);
        }
        return {
          effectSummary: `+${coupon.amount} ${coupon.resource} uses`,
          grantedUntil: null,
          userPatch: null,
        };
      }

      case 'vip_access': {
        // A permanent VIP grant is never downgraded to a dated one.
        const alreadyPermanent = user.isVip && user.vipExpiresAt === null;
        if (coupon.durationDays == null || alreadyPermanent) {
          return {
            effectSummary: 'VIP access (permanent)',
            grantedUntil: null,
            userPatch: { isVip: true, vipExpiresAt: null },
          };
        }
        // A second VIP coupon adds days on top of the running expiry.
        const base =
          user.isVip && user.vipExpiresAt != null && user.vipExpiresAt > now
            ? user.vipExpiresAt
            : now;
        const grantedUntil = addDays(base, coupon.durationDays);
        return {
          effectSummary: `VIP access for ${coupon.durationDays} days`,
          grantedUntil,
          userPatch: { isVip: true, vipExpiresAt: grantedUntil },
        };
      }

      case 'plan_upgrade': {
        if (coupon.planCode == null) {
          throw new CouponInvalidConfigError(coupon.code);
        }
        const targetPlan = await tx.subscriptionPlans.findByCode(
          coupon.planCode,
        );
        if (!targetPlan) throw new CouponInvalidConfigError(coupon.code);

        // `basePlanCode` is only fixed the first time, so the user falls back
        // to the plan they actually paid for, not to whatever a coupon set.
        const basePlanCode =
          user.basePlanCode ?? (user.planCode || DEFAULT_PLAN_CODE);

        const alreadyPermanent =
          user.planCode === coupon.planCode &&
          user.planExpiresAt === null &&
          user.basePlanCode !== null;

        if (coupon.durationDays == null || alreadyPermanent) {
          return {
            effectSummary: `Plan upgrade to ${targetPlan.label} (permanent)`,
            grantedUntil: null,
            userPatch: {
              planCode: coupon.planCode,
              planExpiresAt: null,
              basePlanCode,
            },
          };
        }

        const base =
          user.planCode === coupon.planCode &&
          user.planExpiresAt != null &&
          user.planExpiresAt > now
            ? user.planExpiresAt
            : now;
        const grantedUntil = addDays(base, coupon.durationDays);
        return {
          effectSummary: `Plan upgrade to ${targetPlan.label} for ${coupon.durationDays} days`,
          grantedUntil,
          userPatch: {
            planCode: coupon.planCode,
            planExpiresAt: grantedUntil,
            basePlanCode,
          },
        };
      }

      default:
        throw new CouponInvalidConfigError(coupon.code);
    }
  }

  private async applyEffect(
    tx: IUnitOfWork,
    coupon: CouponEntity,
    user: UserEntity,
    effect: CouponEffect,
  ): Promise<UserEntity> {
    if (coupon.grantType === 'quota_bonus') {
      // Guarded by resolveEffect; narrowed again for the type checker.
      if (coupon.resource == null || coupon.amount == null) {
        throw new CouponInvalidConfigError(coupon.code);
      }
      await tx.userQuotaBonuses.grant(user.id, coupon.resource, coupon.amount);
      return user;
    }

    if (!effect.userPatch) return user;

    const updated = await tx.users.update(user.id, effect.userPatch);
    return updated ?? Object.assign(user, effect.userPatch);
  }

  private toRedemptionType(
    redemption: CouponRedemptionEntity,
  ): CouponRedemptionType {
    return {
      id: redemption.id,
      code: redemption.code,
      grantType: redemption.grantType,
      effectSummary: redemption.effectSummary,
      grantedUntil: redemption.grantedUntil,
      redeemedAt: redemption.redeemedAt,
    };
  }
}
