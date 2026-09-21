import type { CouponResource } from '../../entities/config/coupon.entity';
import type { UserQuotaBonusEntity } from '../../entities/auth/user-quota-bonus.entity';

export interface IUserQuotaBonusRepository {
  findAllByUserId(userId: string): Promise<UserQuotaBonusEntity[]>;
  /** Upserts the bucket, accumulating `amount` on top of the existing grant. */
  grant(
    userId: string,
    resource: CouponResource,
    amount: number,
  ): Promise<UserQuotaBonusEntity>;
  /** Returns false when there is not enough remaining bonus to consume. */
  consume(
    userId: string,
    resource: CouponResource,
    amount: number,
  ): Promise<boolean>;
}
