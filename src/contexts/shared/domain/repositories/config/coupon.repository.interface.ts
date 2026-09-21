import type { CouponEntity } from '../../entities/config/coupon.entity';

export interface ICouponRepository {
  findByCode(code: string): Promise<CouponEntity | null>;
  /**
   * Atomically increments `redeemedCount` only while the coupon is still active,
   * not expired and below `maxRedemptions`. Returns NULL when the slot could not
   * be claimed, which is the real protection against the max-redemptions race.
   */
  claimRedemptionSlot(id: string, now: Date): Promise<CouponEntity | null>;
}
