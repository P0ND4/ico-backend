import { DomainError } from 'src/contexts/shared/domain/errors/domain.error';

/** The code does not exist, or the coupon was manually deactivated. */
export class CouponNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('coupon_not_found: Coupon not found');
  }
}
