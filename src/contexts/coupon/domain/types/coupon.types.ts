import type { CouponGrantType } from 'src/contexts/shared/domain/entities/config/coupon.entity';

export interface CouponRedemptionType {
  id: string;
  code: string;
  grantType: CouponGrantType;
  effectSummary: string;
  /** NULL = the grant does not expire (permanent grants and quota bonuses). */
  grantedUntil: Date | null;
  redeemedAt: Date;
}

export interface RedeemCouponResultType {
  redemption: CouponRedemptionType;
  /** Access state after applying the grant, so the client can refresh at once. */
  planCode: string;
  isVip: boolean;
  vipExpiresAt: Date | null;
  planExpiresAt: Date | null;
}
