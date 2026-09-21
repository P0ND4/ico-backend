import type { CouponRedemptionEntity } from '../../entities/auth/coupon-redemption.entity';

export interface ICouponRedemptionRepository {
  findByCouponAndUser(
    couponId: string,
    userId: string,
  ): Promise<CouponRedemptionEntity | null>;
  findAllByUserId(userId: string): Promise<CouponRedemptionEntity[]>;
  create(
    data: Partial<CouponRedemptionEntity>,
  ): Promise<CouponRedemptionEntity>;
}
