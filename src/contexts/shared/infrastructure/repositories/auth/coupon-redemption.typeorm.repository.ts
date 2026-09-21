import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponRedemptionEntity } from '../../../domain/entities/auth/coupon-redemption.entity';
import type { ICouponRedemptionRepository } from '../../../domain/repositories/auth/coupon-redemption.repository.interface';

@Injectable()
export class CouponRedemptionTypeOrmRepository implements ICouponRedemptionRepository {
  constructor(
    @InjectRepository(CouponRedemptionEntity)
    private readonly repo: Repository<CouponRedemptionEntity>,
  ) {}

  findByCouponAndUser(
    couponId: string,
    userId: string,
  ): Promise<CouponRedemptionEntity | null> {
    return this.repo.findOne({ where: { couponId, userId } });
  }

  findAllByUserId(userId: string): Promise<CouponRedemptionEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { redeemedAt: 'DESC' },
    });
  }

  create(
    data: Partial<CouponRedemptionEntity>,
  ): Promise<CouponRedemptionEntity> {
    return this.repo.save(this.repo.create(data));
  }
}
