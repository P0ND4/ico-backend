import type { RedeemCouponResultType } from '../../domain/types/coupon.types';
import { CouponRedemptionDto } from './coupon-redemption.dto';

export class RedeemResultDto implements RedeemCouponResultType {
  redemption!: CouponRedemptionDto;
  planCode!: string;
  isVip!: boolean;
  vipExpiresAt!: Date | null;
  planExpiresAt!: Date | null;
}
