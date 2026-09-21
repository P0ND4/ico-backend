import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import type { CouponGrantType } from '../config/coupon.entity';

/**
 * Audit trail of a redemption. The UNIQUE (coupon_id, user_id) index is the real
 * guarantee against double redemption — the optimistic pre-check only exists to
 * return a clean error.
 */
@Entity({ schema: 'trn', name: 'coupon_redemptions' })
@Index('uq_coupon_redemptions_coupon_user', ['couponId', 'userId'], {
  unique: true,
})
export class CouponRedemptionEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'coupon_id', type: 'uuid' })
  couponId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /** Snapshot of the coupon code at redemption time. */
  @Column({ type: 'varchar', length: 40 })
  code!: string;

  @Column({ name: 'grant_type', type: 'varchar', length: 20 })
  grantType!: CouponGrantType;

  /** Human readable snapshot of what was granted, for support and history. */
  @Column({ name: 'effect_summary', type: 'varchar', length: 255 })
  effectSummary!: string;

  /** NULL = the grant is permanent or has no expiry (quota bonuses). */
  @Column({ name: 'granted_until', type: 'timestamptz', nullable: true })
  grantedUntil!: Date | null;

  @Column({ name: 'redeemed_at', type: 'timestamptz', default: () => 'NOW()' })
  redeemedAt!: Date;
}
