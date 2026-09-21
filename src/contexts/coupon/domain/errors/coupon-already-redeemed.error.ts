import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

export class CouponAlreadyRedeemedError extends DomainError {
  readonly statusCode = 409;

  constructor() {
    super('coupon_already_redeemed: Coupon already redeemed by this user');
  }
}
