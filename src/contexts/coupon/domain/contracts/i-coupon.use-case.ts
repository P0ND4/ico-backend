import type {
  CouponRedemptionType,
  RedeemCouponResultType,
} from '../types/coupon.types';

export const COUPON_USE_CASE = Symbol('COUPON_USE_CASE');

export interface RedeemCouponParams {
  userId: string;
  code: string;
}

export interface ICouponUseCase {
  redeem(params: RedeemCouponParams): Promise<RedeemCouponResultType>;
  listMine(userId: string): Promise<CouponRedemptionType[]>;
}
