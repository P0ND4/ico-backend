import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserQuotaBonusEntity } from '../../../domain/entities/auth/user-quota-bonus.entity';
import type { CouponResource } from '../../../domain/entities/config/coupon.entity';
import type { IUserQuotaBonusRepository } from '../../../domain/repositories/auth/user-quota-bonus.repository.interface';

@Injectable()
export class UserQuotaBonusTypeOrmRepository implements IUserQuotaBonusRepository {
  constructor(
    @InjectRepository(UserQuotaBonusEntity)
    private readonly repo: Repository<UserQuotaBonusEntity>,
  ) {}

  findAllByUserId(userId: string): Promise<UserQuotaBonusEntity[]> {
    return this.repo.find({ where: { userId } });
  }

  async grant(
    userId: string,
    resource: CouponResource,
    amount: number,
  ): Promise<UserQuotaBonusEntity> {
    await this.repo.query(
      `INSERT INTO trn.user_quota_bonuses (user_id, resource, granted_uses, consumed_uses)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (user_id, resource)
       DO UPDATE SET granted_uses = trn.user_quota_bonuses.granted_uses + EXCLUDED.granted_uses`,
      [userId, resource, amount],
    );
    return this.repo.findOneOrFail({ where: { userId, resource } });
  }

  async consume(
    userId: string,
    resource: CouponResource,
    amount: number,
  ): Promise<boolean> {
    const rows: unknown[] = await this.repo.query(
      `UPDATE trn.user_quota_bonuses
          SET consumed_uses = consumed_uses + $3
        WHERE user_id = $1
          AND resource = $2
          AND consumed_uses + $3 <= granted_uses
      RETURNING user_id`,
      [userId, resource, amount],
    );
    return Array.isArray(rows) && rows.length > 0;
  }
}
