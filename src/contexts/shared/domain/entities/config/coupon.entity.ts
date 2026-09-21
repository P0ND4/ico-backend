import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';

/** What a coupon grants when redeemed. */
export type CouponGrantType = 'quota_bonus' | 'vip_access' | 'plan_upgrade';

/** Quota bucket a `quota_bonus` coupon tops up. Mirrors the quota feature keys. */
export type CouponResource =
  | 'tutor'
  | 'summary'
  | 'standard_path'
  | 'deep_path';

@Entity({ schema: 'con', name: 'coupons' })
export class CouponEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Always stored uppercase; lookups normalize the input before querying. */
  @Column({ type: 'varchar', length: 40, unique: true })
  code!: string;

  @Column({ name: 'grant_type', type: 'varchar', length: 20 })
  grantType!: CouponGrantType;

  /** Only meaningful for `quota_bonus`. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  resource!: CouponResource | null;

  /** Extra uses granted by a `quota_bonus` coupon. */
  @Column({ type: 'integer', nullable: true })
  amount!: number | null;

  /** Target plan for a `plan_upgrade` coupon. */
  @Column({ name: 'plan_code', type: 'varchar', length: 50, nullable: true })
  planCode!: string | null;

  /** NULL = permanent grant; N = the grant expires N days after redemption. */
  @Column({ name: 'duration_days', type: 'integer', nullable: true })
  durationDays!: number | null;

  /** NULL = unlimited redemptions. */
  @Column({ name: 'max_redemptions', type: 'integer', nullable: true })
  maxRedemptions!: number | null;

  @Column({ name: 'redeemed_count', type: 'integer', default: 0 })
  redeemedCount!: number;

  /** NULL = never expires. */
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  /** Manual kill-switch; an inactive coupon behaves as if it did not exist. */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
