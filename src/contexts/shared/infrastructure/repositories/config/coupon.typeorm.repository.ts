import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponEntity } from 'src/contexts/shared/domain/entities/config/coupon.entity';
import type { ICouponRepository } from 'src/contexts/shared/domain/repositories/config/coupon.repository.interface';

@Injectable()
export class CouponTypeOrmRepository implements ICouponRepository {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly repo: Repository<CouponEntity>,
  ) {}

  findByCode(code: string): Promise<CouponEntity | null> {
    return this.repo.findOne({ where: { code } });
  }

  async claimRedemptionSlot(
    id: string,
    now: Date,
  ): Promise<CouponEntity | null> {
    // Single conditional statement: Postgres takes a row lock, so a concurrent
    // transaction re-evaluates the predicate against the already incremented
    // counter and gets no row back.
    const rows: unknown[] = await this.repo.query(
      `UPDATE con.coupons
          SET redeemed_count = redeemed_count + 1,
              updated_at = NOW()
        WHERE id = $1
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > $2)
          AND (max_redemptions IS NULL OR redeemed_count < max_redemptions)
      RETURNING id`,
      [id, now],
    );

    if (!Array.isArray(rows) || rows.length === 0) return null;
    return this.repo.findOne({ where: { id } });
  }
}
