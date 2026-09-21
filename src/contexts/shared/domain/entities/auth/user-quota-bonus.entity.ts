import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { CouponResource } from '../config/coupon.entity';

/**
 * Permanent extra uses granted by coupons. It needs its own consumption counter
 * because plan quotas reset every `quota_reset_days` — deriving the bonus from
 * the plan limit would re-grant it on every period.
 */
@Entity({ schema: 'trn', name: 'user_quota_bonuses' })
export class UserQuotaBonusEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ name: 'resource', type: 'varchar', length: 20 })
  resource!: CouponResource;

  @Column({ name: 'granted_uses', type: 'integer', default: 0 })
  grantedUses!: number;

  /** Never reset. Bonus uses are consumed only once the plan quota is exhausted. */
  @Column({ name: 'consumed_uses', type: 'integer', default: 0 })
  consumedUses!: number;
}
