import type { UserEntity } from '../entities/auth/user.entity';
import type { SubscriptionPlanEntity } from '../entities/config/subscription-plan.entity';
import type { IUnitOfWork } from '../repositories/unit-of-work.interface';

/** Fields that must be normalized once a time-boxed grant has elapsed. */
export interface ExpiredAccessPatch {
  isVip?: boolean;
  vipExpiresAt?: Date | null;
  planCode?: string;
  planExpiresAt?: Date | null;
  basePlanCode?: string | null;
}

export interface EffectiveAccess {
  user: UserEntity;
  plan: SubscriptionPlanEntity | null;
}

export const DEFAULT_PLAN_CODE = 'free';

/**
 * Pure predicate: returns the patch needed to drop expired VIP / plan grants,
 * or NULL when nothing expired. Mirrors `shouldResetPeriod` in shape.
 */
export function computeExpiredAccess(
  user: UserEntity,
  now: Date = new Date(),
): ExpiredAccessPatch | null {
  const patch: ExpiredAccessPatch = {};

  if (user.isVip && user.vipExpiresAt != null && user.vipExpiresAt <= now) {
    patch.isVip = false;
    patch.vipExpiresAt = null;
  }

  if (user.planExpiresAt != null && user.planExpiresAt <= now) {
    patch.planCode = user.basePlanCode ?? DEFAULT_PLAN_CODE;
    patch.planExpiresAt = null;
    patch.basePlanCode = null;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

/**
 * Lazy write on the read path (same strategy as `resetPeriod`): normalizes the
 * row when a grant expired and resolves the plan that must be enforced.
 * `isVipActive` is the second safety net if this write ever fails.
 */
export async function resolveEffectiveAccess(
  uow: IUnitOfWork,
  user: UserEntity,
  now: Date = new Date(),
): Promise<EffectiveAccess> {
  const patch = computeExpiredAccess(user, now);
  let effectiveUser = user;

  if (patch) {
    const updated = await uow.users.update(user.id, patch);
    effectiveUser = updated ?? Object.assign(user, patch);
  }

  const plan = await uow.subscriptionPlans.findByCode(
    effectiveUser.planCode ?? DEFAULT_PLAN_CODE,
  );

  return { user: effectiveUser, plan };
}
