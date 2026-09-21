import type { CouponGrantType } from 'src/contexts/shared/domain/entities/config/coupon.entity';
import type { CouponRedemptionType } from '../../domain/types/coupon.types';

export class CouponRedemptionDto implements CouponRedemptionType {
  id!: string;
  code!: string;
  grantType!: CouponGrantType;
  effectSummary!: string;
  grantedUntil!: Date | null;
  redeemedAt!: Date;
}
